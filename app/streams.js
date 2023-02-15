module.exports = function() {
  /**
   * available streams
   * the id value is considered unique (provided by socket.io)
   */
  var streamList = [];

  /**
   * Stream object
   */
  var Stream = function(id, name, userId, type, orgId) {
    this.name = name;
    this.id = id;
    this.userId = userId;
    this.type = type;
    this.orgId = orgId
  };

  return {
    addStream: function(id, name, userId, type, orgId) {
      var stream = new Stream(id, name, userId, type, orgId);
      streamList = streamList.filter(obj => obj.userId != userId);
      streamList.push(stream);
    },

    removeStream: function(id) {
      var index = 0;
      while (index < streamList.length && streamList[index].id != id) {
        index++;
      }
      streamList.splice(index, 1);
    },

    // update function
    update: function(id, name, userId, type) {
      console.log("updatestream", id, name, userId, type);
      if (!type) return;
      console.log("streamList before", streamList)
      streamList = streamList.filter(obj => obj.userId != userId);
      console.log("streamList after", streamList)
      var stream = streamList.find(function(element, i, array) {
        return element.id == id;
      });
      if (stream) {
        stream.name = name ? name : null;
        stream.userId = userId ? userId : null;
        stream.type = type ? type : null;
      }
    },

    getStreams: function() {
      return streamList;
    }
  };
};
