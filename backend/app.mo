import Nat "mo:base/Nat";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Result "mo:base/Result";

actor LastPingFactory {
  // Individual user's LastPing data
  public type UserPingData = {
    owner: Principal;
    backupWallet: ?Principal;
    lastPing: Time.Time;
    timeout: Nat;
  };
  private stable var users : [(Principal, UserPingData)] = [];
  private var userMap = HashMap.HashMap<Principal, UserPingData>(0, Principal.equal, Principal.hash);

  // Restore state after upgrade
  system func preupgrade() {
    users := Iter.toArray(userMap.entries());
  };

  system func postupgrade() {
    userMap := HashMap.fromIter<Principal, UserPingData>(users.vals(), users.size(), Principal.equal, Principal.hash);
  };

  // Initialize a new user's LastPing account
  public shared(msg) func initializeUser() : async Result.Result<Text, Text> {
    let caller = msg.caller;
    
    // Check if user already exists
    switch (userMap.get(caller)) {
      case (?existing) {
        #err("User already has an active LastPing account");
      };
      case null {
        let newUserData : UserPingData = {
          owner = caller;
          backupWallet = null;
          lastPing = Time.now();
          timeout = 30 * 86_400_000_000_000; // 30 days in nanoseconds
        };
        userMap.put(caller, newUserData);
        #ok("LastPing account initialized successfully");
      };
    };
  };

  // Set backup wallet for the calling user
  public shared(msg) func setBackup(backupPrincipal : Principal) : async Result.Result<Text, Text> {
    let caller = msg.caller;
    
    switch (userMap.get(caller)) {
      case (?userData) {
        let updatedData : UserPingData = {
          owner = userData.owner;
          backupWallet = ?backupPrincipal;
          lastPing = userData.lastPing;
          timeout = userData.timeout;
        };
        userMap.put(caller, updatedData);
        #ok("Backup wallet set successfully");
      };
      case null {
        #err("User not found. Please initialize your account first.");
      };
    };
  };

  // Set timeout for the calling user
  public shared(msg) func setTimeout(newTimeout : Nat) : async Result.Result<Text, Text> {
    let caller = msg.caller;
    
    switch (userMap.get(caller)) {
      case (?userData) {
        let updatedData : UserPingData = {
          owner = userData.owner;
          backupWallet = userData.backupWallet;
          lastPing = userData.lastPing;
          timeout = newTimeout;
        };
        userMap.put(caller, updatedData);
        #ok("Timeout updated successfully");
      };
      case null {
        #err("User not found. Please initialize your account first.");
      };
    };
  };

  // Ping function for the calling user
  public shared(msg) func ping() : async Result.Result<Text, Text> {
    let caller = msg.caller;
    
    switch (userMap.get(caller)) {
      case (?userData) {
        let updatedData : UserPingData = {
          owner = userData.owner;
          backupWallet = userData.backupWallet;
          lastPing = Time.now();
          timeout = userData.timeout;
        };
        userMap.put(caller, updatedData);
        #ok("Ping successful! Timer reset.");
      };
      case null {
        #err("User not found. Please initialize your account first.");
      };
    };
  };

  // Claim ownership (called by backup wallet)
  public shared(msg) func claim(originalOwner : Principal) : async Result.Result<Text, Text> {
    let caller = msg.caller;
    
    switch (userMap.get(originalOwner)) {
      case (?userData) {
        // Check if caller is the backup wallet
        switch (userData.backupWallet) {
          case (?backup) {
            if (Principal.equal(caller, backup)) {
              // Check if timeout has expired
              if (Time.now() > userData.lastPing + userData.timeout) {
                // Transfer ownership to backup
                let updatedData : UserPingData = {
                  owner = backup;
                  backupWallet = null; // Reset backup wallet after claim
                  lastPing = Time.now();
                  timeout = userData.timeout;
                };
                userMap.put(originalOwner, updatedData);
                #ok("Ownership claimed successfully");
              } else {
                #err("Timeout period has not expired yet");
              };
            } else {
              #err("Only the designated backup wallet can claim ownership");
            };
          };
          case null {
            #err("No backup wallet is set for this account");
          };
        };
      };
      case null {
        #err("Original owner account not found");
      };
    };
  };

  // Get status for the calling user
  public shared(msg) func getMyStatus() : async Result.Result<UserPingData, Text> {
    let caller = msg.caller;
    
    switch (userMap.get(caller)) {
      case (?userData) {
        #ok(userData);
      };
      case null {
        #err("User not found. Please initialize your account first.");
      };
    };
  };

  // Get status for any user (useful for backup wallets to check)
  public query func getUserStatus(user : Principal) : async Result.Result<UserPingData, Text> {
    switch (userMap.get(user)) {
      case (?userData) {
        #ok(userData);
      };
      case null {
        #err("User not found");
      };
    };
  };

  // Check if user exists
  public query func userExists(user : Principal) : async Bool {
    switch (userMap.get(user)) {
      case (?_) { true };
      case null { false };
    };
  };

  // Get all users (for admin purposes - you might want to restrict this)
  public query func getAllUsers() : async [Principal] {
    Iter.toArray(userMap.keys());
  };
}
