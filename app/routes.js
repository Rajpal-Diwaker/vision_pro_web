module.exports = function(app, streams) {

  // GET home 
  var index = function(req, res) {
    res.render('index', { 
                          title: 'Vision Pro', 
                          header: 'Visionpro streaming',
                          username: 'Username',
                          share: 'Share this link',
                          footer: '',
                          id: req.params.id
                        });
  };

  // GET streams as JSON
  var displayStreams = function(req, res) {
    console.log("displayStreams", req.query)
    const { orgId, socketId } = req.query

    if(socketId){
      console.log("socketId", socketId)
    }

    var streamList = streams.getStreams();
    // JSON exploit to clone streamList.public
    streamList = JSON.parse(JSON.stringify(streamList))
    data = {}
    console.log("streamList", streamList)
    data.users = streamList.filter(obj=>{  if(!obj.name  ||  obj.type =='Expert' ){return false} return true;  }); 
    data.experts = streamList.filter(obj=>{  
      console.log("streamList objobj", obj)
      if(obj.type && obj.type =='Expert' && obj.name){ delete obj.type; return true} return false;  }); 
    console.log("data.experts1", data.experts)
    console.log("orgId", orgId)
    if(orgId) {
      data.experts = data.experts.filter(obj=> obj.orgId == orgId)
    }
    console.log("data.experts2", data.experts)

    res.status(200).json(data);
  };

  app.get('/streams.json', displayStreams);
  app.get('/', index);
  app.get('/:id', index);
  app.get('/callpopupflag.js', (req, res) => {
    const { orgId, userId } = req.query
    console.log("detailFunc", req.query)
  })
}