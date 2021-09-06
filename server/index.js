let bindings = [];

require('dotenv').config()
const uuid = require('uuid').v4;
const Net = require('net');
const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {});

io.on("connection", (socket) => {
  console.log('New client connected!');
  socket.on("register", (pw, port, cb) => {
    if(pw === process.env.CLIENT_SECRET) {
      console.log(`Registering port ${port}...`)
      if(bindings.find(x => x.port === port) || port === Number(process.env.PORT)) {
        console.log('Port taken.');
        cb(undefined, "Port taken.");
        return;
      }

      // Create TCP Server, assign Server ID, send Server ID to WS Client
      const server = new Net.Server();
      const sid = uuid();
      server.listen(port, () => {
        console.log(`Server listening on port ${port}!`)
        bindings.push({ port, server }); 
        cb(sid, undefined);
      });

      server.on('error', (err) => {
        console.log(`Server error on port ${port}!`, err);
        socket.emit('server error', sid, err);
      });

      server.on('close', () => {
        console.log(`Server closed on port ${port}`)
        socket.emit('server close', sid);
        bindings = bindings.filter(x => x.port !== port);
      });

      server.on('connection', (servSock) => {
        const cid = uuid();
        console.log(`Received new connection on port ${port}`)
        socket.emit('server connection', sid, cid);

        servSock.on('close', (err) => {
          console.log(`Client closed on port ${port}`)
          socket.emit("close", sid, cid, err);
        });
        servSock.on('connect', () => {
          socket.emit('connect', sid, cid);
        });
        servSock.on('drain', () => {
          socket.emit('drain', sid, cid);
        });
        servSock.on('end', () => {
          console.log(`Client end on port ${port}`)
          socket.emit('end', sid, cid);
        });
        servSock.on("data", (chunk) => {
          socket.emit("data", sid, cid, chunk);
        });

        socket.on("data", (server_id, client_id, chunk) => {
          if(client_id === cid && server_id === sid) {
            servSock.write(chunk);
          }
        })
      });
    } else {
      cb(undefined, "Password incorrect.")
    }
  });

  // Close the port, if its open.
  socket.on('server close', (port) => {
    const bind = bindings.find(x => x.port === port)
      
    if(bind) bind.server.close();
  })
});

httpServer.listen(Number(process.env.PORT), () => {
  console.log(`Listening on port ${process.env.PORT}.`);
});