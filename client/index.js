const { io } = require('socket.io-client');
const { register } = require('./register.js')
const socket = io("https://tcp-proxy.chezy.dev");

socket.on("connect", () => {
  // Register pre-configured
  register(socket, 25567, (error) => {
    if(error) {
      console.log(error);
      return;
    }
  })
});

socket.on('server error', (err) => {

});

socket.on('server close', () => {

});

socket.on('server connection', (id) => {

});

socket.on('close', (id, err) => {

});

socket.on('connect', (id) => {

});

socket.on('drain', (id) => {

});

socket.on('end', (id) => {

});

socket.on('data', (id, chunk) => {

});