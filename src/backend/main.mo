import OutCall "http-outcalls/outcall";

actor {
  let appsScriptUrl = "https://script.google.com/macros/s/AKfycbwRIy8g7GCjgyj8K2kbIVo6RO19R7bBdGcjAf2MvnJPDlKmuzh4_b2PvlP8o1VHKsHp/exec";

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public func getMembers() : async Text {
    let url = appsScriptUrl # "?action=getMembers";
    await OutCall.httpGetRequest(url, [], transform);
  };

  public func getAttendance() : async Text {
    let url = appsScriptUrl # "?action=getAttendance";
    await OutCall.httpGetRequest(url, [], transform);
  };

  public func checkIn(membershipId : Text, clientName : Text, packageDetails : Text, packageValidity : Text, status : Text) : async Text {
    let payload = "{
      \"action\": \"checkIn\",
      \"membershipId\": " # membershipId # ",
      \"clientName\": " # clientName # ",
      \"packageDetails\": " # packageDetails # ",
      \"packageValidity\": " # packageValidity # ",
      \"status\": " # status #
      "}";
    await OutCall.httpPostRequest(appsScriptUrl, [], payload, transform);
  };

  public func checkOut(membershipId : Text) : async Text {
    let payload = "{
      \"action\": \"checkOut\",
      \"membershipId\": " # membershipId # "
    }";
    await OutCall.httpPostRequest(appsScriptUrl, [], payload, transform);
  };
};
