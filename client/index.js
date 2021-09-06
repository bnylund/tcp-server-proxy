const { io } = require('socket.io-client');
const ServerManager = new (require('./server.js')).ServerManager();
//const socket = io("https://srv.chezy.dev:9050", {secure: true});
const socket = io("http://localhost:9050");

/*

  We need to map client connections from this app to client connections on the server

  CLIENT -> WS Server -> WS Client -> 10.8.0.6:25567
  10.8.0.6:25567 -> WS Client -> WS Server -> CLIENT

  We can also register ports we want to be relayed using the register command.
*/

socket.on("connect", () => {
  // Register pre-configured
  ServerManager.register(socket, 'localhost', 25567, (sid, error) => {
    if(error) {
      console.log('Register Error:',error);
      return;
    }
  })

  socket.on('server error', (sid, serv_err) => {
    const serv = ServerManager.servers.find(x => x.id === sid);
    console.log(`Server error on port ${serv.port}!`, serv_err)
  })

  socket.on('server close', (serv_id) => {
    const serv = ServerManager.servers.find(x => x.id === serv_id)
    if(serv) {
      console.log(`Remote port ${serv.port} closed.`);
      serv.connections.forEach((con) => {
        console.log(`Destroying connection to ${serv.local_address}:${serv.port}`)
        con.destroy()
      })
    }
  })
});