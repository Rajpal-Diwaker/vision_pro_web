module.exports = function(io, streams) {
  
  io.on("connection", function(client) {
    let locationArr = []
    console.log("clientid", client.id);

    client.on("callStatus", function(details) {
      console.log("callStatus", details);
      var otherClient = io.sockets.connected[details.to];
      if (!otherClient) return;
      console.log("nahi arra");
      otherClient.emit("callStatusClient", details);
    });

    client.on("cancelCallAgent", function(details) {
      console.log("cancelCallAgent", details);
      var otherClient = io.sockets.connected[details.to];
      if (!otherClient) return;

      otherClient.emit("callCancel");
    });

    client.on("endCallAgent", function(id) {
      var otherClient = io.sockets.connected[id];
      if (!otherClient) return;
      console.log("endCallAgent", id);
      if (otherClient) otherClient.emit("cancelCall");
    });

    client.on("rejectCall", function(details) {
      console.log("rejectCall", details);

      var otherClient = io.sockets.connected[details.id];
      otherClient.emit("rejectCallClient", details);
    });

    client.on("addExpert", obj => {
      console.log("addExpert", obj);
      streams.addStream(client.id, obj.name, obj.userId, obj.type, obj.orgId);
    });

    client.on("changeExpertStatus", userId => {
      console.log("changeExpertStatus", userId);
      let users = streams
        .getStreams()
        .filter(obj => obj.userId == userId && obj.type == "Expert");
      console.log("users", users);
      users.forEach((obj, i) => {
        streams.removeStream(obj.id);
      });
    });

    client.on("logoutEvt", userId => {
      console.log("logoutEvt");
      let users = streams
        .getStreams()
        .filter(obj => obj.userId == userId && obj.type == "Expert");
      let users_length = users.length;
      console.log("users", users);
      users.forEach((obj, i) => {
        const otherClient = io.sockets.connected[obj.id];
        if (otherClient) otherClient.emit("logoutEvtOthers");
        console.log(obj.id);
        streams.removeStream(obj.id);
      });
    });

    client.on("onLoadAgent", function(details) {
      console.log("onLoadAgent");
      let users = streams.getStreams().filter(obj => obj.type == "Users");
      client.emit("onLoadAgentSend", users);
    });

    client.on("send", function(details) {
      console.log("send1111", details);
      if(details.type && details.type == "welcome"){
        details['id'] = details.socketId
        console.log("send222 users", details)
        Object.keys(io.sockets.connected).forEach(elem => {
          const otherClient = io.sockets.connected[elem];
          console.log("ffdfdfd")
          otherClient.emit("users", details);
        }); 

        
      }else{
        streams.update(
          details.socketId,
          details.socketId,
          details.userId,
          "Users"
        );
        let users = streams.getStreams().filter(obj => obj.type == "Users");
        console.log("send1111 users", users)

        Object.keys(io.sockets.connected).forEach(elem => {
          const otherClient = io.sockets.connected[elem];
          otherClient.emit("location", details);
          otherClient.emit("users", users);
        });
      }

     
    });

    client.on("online", function(details) {
        console.log("online", details, "streams", streams)
        Object.keys(io.sockets.connected).forEach(elem => {
          console.log(elem)
        })
    });

    client.on("offline", function(details) {
      streams.removeStream(details.socketId);
      console.log("offline", details);
      let users = streams.getStreams().filter(obj => obj.type == "Users");
      console.log("users", users);
      Object.keys(io.sockets.connected).forEach(elem => {
        const otherClient = io.sockets.connected[elem];
        const offlineId = details.socketId;
        otherClient.emit("offline", offlineId);
      });
    });

    client.on("sendMsg", function(details) {
      console.log("sendMsg", details);
      if(!details.to) return
      var otherClient = io.sockets.connected[details.to];

      if (!otherClient) 
        return;
      
      delete details.to;
      details.from = client.id;
      otherClient.emit("sendMsg", details);
      otherClient.emit("updatelocation", locationArr);
    });

    //if (client.type) {
    console.log("-- " + client.id + " joined --");
    streams.addStream(client.id, null, null);
    client.emit("id", client.id);
    //}

    client.on("qwery", function(streamid) {
      console.log("qwery", streamid);
      //const streamids = streamid ? streamid : client.id;
      client.emit("id", streamids);
    });

    client.on("location", function(details) {
      if(!details.latitude && !details.longitude) return
      if(details && details.latitude && details.longitude == 0) return
      console.log("location", details);
      
      locationArr.push(details)
      console.log("locationArr", locationArr)
      if(details.to){
        var otherClient = io.sockets.connected[details.to];
        if (!otherClient) return
        console.log("otherClient loc")
        
        otherClient.emit("updatelocation", details);
      }
    });

    client.on("cancelCallByOther", function(details) {
      console.log("cancelCallByOther", details);
      
      if(details.to){
        var otherClient = io.sockets.connected[details.to];
        if (!otherClient) return
        console.log("otherClient cancelCallByOther")
        
        otherClient.emit("cancelCallByOther", details);
      }
    });


    client.on("cancelCall", function(details) {
      console.log("cancelCall", details);
      client.emit("cancelCall", details);
    });

    client.on("message", function(details) {
      console.log("message", details);
      var otherClient = io.sockets.connected[details.to];

      if (!otherClient) {
        return;
      }
      delete details.to;
      details.from = client.id;
      otherClient.emit("message", details);
      otherClient.emit("updatelocation", locationArr);
      client.emit("updatelocation", locationArr);
    });

    client.on("snap", function(details) {
      var otherClient = io.sockets.connected[details.to];
      if (!otherClient) return;
      console.log("snap event");
      otherClient.emit("snap", details);
    });

    client.on("disconn", function(details) {
      console.log("disconn", details);
      client.emit("disconn_call", {locationArr: locationArr});
    });

    client.on("calling", function(details) {
      console.log("calling", details);
      var otherClient = io.sockets.connected[details.to];

      if (!otherClient) {
        return;
      }
      delete details.to;
      details.from = client.id;
      otherClient.emit("calling", details);
    });

    client.on("status", function(details) {
      console.log("status");
    });

    client.on("callresponse", function(details) {
      console.log("callresponse", details);
      var otherClient = io.sockets.connected[details.to];

      if (!otherClient) {
        return;
      }
      delete details.to;
      details.from = client.id;
      otherClient.emit("callresponse", details);
      otherClient.emit("updatelocation", locationArr);
      client.emit("updatelocation", locationArr);
    });

    client.on("endcallEvt", function(details) {
      console.log("endcallEvt----------", details);
      var otherClient = io.sockets.connected[details.to];

      if (!otherClient) {
        return;
      }
      delete details.to;
      details.from = client.id;
      otherClient.emit("endcallEvt", details);
      otherClient.emit("updatelocation", locationArr);
      client.emit("updatelocation", locationArr);
    });

    client.on("readyToStream", function(options) {
      console.log("-- " + client.id + " is ready to stream --");

      streams.update(client.id, options.name, options.userId, options.type);
    });

    client.on("update", function(options) {
      console.log("update", client.id, options);
      console.log(options);
      streams.update(client.id, options.name, options.userId, options.type);
     

      Object.keys(io.sockets.connected).forEach(elem => {
        const otherClient = io.sockets.connected[elem];
        if (otherClient) {
          console.log("updateUserStatus", elem)
          otherClient.emit("updateUserStatus", options);
        }
      })

      client.emit("updatelocation", locationArr);
    });

    function leave() {
      console.log("-- " + client.id + " left --");
      streams.removeStream(client.id);
    }

    client.on("disconnect", leave);
    client.on("leave", function() {
      console.log("-- " + client.id + " leave --");
      streams.removeStream(client.id);
    });
    client.on("new-message", message => {
      console.log(message);
      client.emit("new-message", message);
    });
  });
};
