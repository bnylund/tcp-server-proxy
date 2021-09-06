const Net = require('net');
require('dotenv').config()

class ServerManager {

  /*

  {
    "id": string,
    "local_address": string,
    "port": number,
    "connections": array
  }
  */
  servers = []

  register(socket, local_address, port, cb) {
    // Reserve port
    socket.emit('register', process.env.CLIENT_SECRET, port, (sid, err) => {

      if(!err) {
        console.log(`Server opened on port ${port}`)
      }

      // A client connected on server side, connect to server on our side
      socket.on('server connection', (serv_id, cid) => {
        const client = this.connect(local_address, port);
        socket.on('close', (server_id, cli_id, serv_err) => {
          if(server_id === serv_id && cid === cli_id) {
            client.destroy(serv_err);
            const serv = this.servers.find(x => x.id === server_id);
            if(serv) {
              console.log(`Client disconnected from server on port ${serv.port}`);
            }
          }
        })
  
        socket.on('connect', (server_id, cli_id) => {
          if(server_id === serv_id && cid === cli_id) {
            client.emit('connect')
          }
        })
  
        socket.on('drain', (server_id, cli_id) => {
          if(server_id === serv_id && cid === cli_id) {
            client.emit('drain');
          }
        })
  
        socket.on('end', (server_id, cli_id) => {
          if(server_id === serv_id && cid === cli_id) {
            const serv = this.servers.find(x => x.id === serv_id);
            if(serv) {
              console.log(`Ending connection on port ${serv.port}`);
            }
            client.end()
          }
        })
  
        socket.on('data', (server_id, cli_id, chunk) => {
          if(server_id === serv_id && cid === cli_id) {
            client.write(chunk)
          }
        })

        client.on('data', (data) => {
          socket.emit('data', serv_id, cid, data);
        })

        const serv = this.servers.find(x => x.id === serv_id);
        if(serv) {
          console.log(`Connection received on port ${serv.port}, opening local connection`)
          serv.connections.push(client);
        }
      })

      this.servers.push({
        id: sid,
        local_address,
        port,
        connections: []
      })
      cb(sid, err);
    })
  }

  close(socket, port) {
    socket.emit('server close', port)
  }

  connect(address, port) {
    const client = new Net.Socket();
    client.connect(port, address);
    client.on('error', (err) => {
      console.log(`An error occurred with client connection to ${address}:${port}.`, err)
    })
    return client;
  }
}

module.exports = {
  ServerManager
}