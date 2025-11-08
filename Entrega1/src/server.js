const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('./config');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const chatRoutes = require('./routes/chatRoutes');
const User = require('./models/User');
const Product = require('./models/Product');
const Chat = require('./models/Chat');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});


app.use(express.json());
app.use(express.static('src/public'));


app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chats', chatRoutes);


mongoose.connect(config.mongoUri)
  .then(async () => {
    console.log('✅ Conectado a MongoDB');
    await initializeDatabase();
  })
  .catch(err => console.error('❌ Error al conectar a MongoDB:', err));


async function initializeDatabase() {
  try {
    
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    if (!adminExists) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        email: 'admin@example.com',
        password: adminPassword,
        name: 'Administrador',
        role: 'admin'
      });
      console.log('✅ Usuario admin creado');
    }

    const userExists = await User.findOne({ email: 'celia@example.com' });
    if (!userExists) {
      const userPassword = await bcrypt.hash('celia123', 10);
      await User.create({
        email: 'celia@example.com',
        password: userPassword,
        name: 'Celia',
        role: 'user'
      });
      console.log('✅ Usuario celia creado');
    }

    
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      await Product.insertMany([
        {
          name: 'Corte de Cabello Mujer',
          description: 'Corte profesional adaptado a tu estilo',
          price: 25,
          duration: '45 min',
          category: 'Cortes'
        },
        {
          name: 'Corte de Cabello Hombre',
          description: 'Corte clásico o moderno con acabado perfecto',
          price: 15,
          duration: '30 min',
          category: 'Cortes'
        },
        {
          name: 'Tinte Completo',
          description: 'Coloración completa con productos profesionales',
          price: 45,
          duration: '2 horas',
          category: 'Coloración'
        },
        {
          name: 'Mechas',
          description: 'Mechas californianas o balayage',
          price: 60,
          duration: '2.5 horas',
          category: 'Coloración'
        },
        {
          name: 'Peinado con Secado',
          description: 'Secado y peinado profesional',
          price: 20,
          duration: '40 min',
          category: 'Peinados'
        },
        {
          name: 'Tratamiento Capilar',
          description: 'Tratamiento hidratante y reparador',
          price: 30,
          duration: '1 hora',
          category: 'Tratamientos'
        },
        {
          name: 'Manicura',
          description: 'Manicura completa con esmaltado',
          price: 18,
          duration: '45 min',
          category: 'Manicura y Pedicura'
        },
        {
          name: 'Pedicura',
          description: 'Pedicura completa con esmaltado',
          price: 25,
          duration: '1 hora',
          category: 'Manicura y Pedicura'
        }
      ]);
      console.log('✅ Productos de ejemplo creados');
    }
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
  }
}


io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Autenticación requerida'));
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    socket.userId = decoded.id;
    socket.userEmail = decoded.email;
    socket.userName = decoded.name;
    socket.userRole = decoded.role;
    next();
  } catch (error) {
    next(new Error('Token inválido'));
  }
});

io.on('connection', async (socket) => {
  console.log(`✅ Usuario conectado: ${socket.userName} (${socket.userRole})`);

  try {
    
    if (socket.userRole === 'user') {
    
      let chat = await Chat.findOne({ 
        userId: socket.userId, 
        status: 'active' 
      });
      
      if (!chat) {
      
        chat = new Chat({
          userId: socket.userId,
          userName: socket.userName,
          userEmail: socket.userEmail
        });
        
        try {
          await chat.save();
          console.log(`✅ Nuevo chat creado para ${socket.userName}`);
        } catch (error) {
          
          if (error.code === 11000) {
            console.log('Chat ya existe, buscando...');
            chat = await Chat.findOne({ 
              userId: socket.userId, 
              status: 'active' 
            });
          } else {
            throw error;
          }
        }
      }
      
      socket.join(`chat_${chat._id}`);
      socket.chatId = chat._id;
      
   
      socket.emit('chat_ready', { chatId: chat._id.toString() });
      console.log(`Usuario ${socket.userName} unido al chat ${chat._id}`);
    }

    
    if (socket.userRole === 'admin') {
      socket.join('admin_room');
      const activeChats = await Chat.find({ status: 'active' });
      activeChats.forEach(chat => {
        socket.join(`chat_${chat._id}`);
      });
      console.log(`Admin unido a ${activeChats.length} chats`);
    }

    
    socket.on('send_message', async (data) => {
      try {
        const { chatId, message } = data;
        
        if (!message || !chatId) {
          socket.emit('error', { message: 'Datos incompletos' });
          return;
        }

        console.log(`Mensaje de ${socket.userName} en chat ${chatId}: ${message}`);

        const newMessage = new Message({
          chatId,
          senderId: socket.userId,
          senderName: socket.userName,
          message,
          isAdmin: socket.userRole === 'admin'
        });
        await newMessage.save();

        
        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: message,
          lastMessageTime: new Date()
        });

       
        io.to(`chat_${chatId}`).emit('receive_message', {
          _id: newMessage._id.toString(),
          chatId: newMessage.chatId.toString(),
          senderId: newMessage.senderId.toString(),
          senderName: newMessage.senderName,
          message: newMessage.message,
          isAdmin: newMessage.isAdmin,
          createdAt: newMessage.createdAt
        });

        console.log(`✅ Mensaje enviado a chat_${chatId}`);

        
        if (socket.userRole === 'user') {
          io.to('admin_room').emit('new_user_message', {
            chatId: chatId.toString(),
            userName: socket.userName,
            message
          });
        }
      } catch (error) {
        console.error('❌ Error al enviar mensaje:', error);
        socket.emit('error', { message: 'Error al enviar mensaje: ' + error.message });
      }
    });


    socket.on('get_chats', async () => {
      if (socket.userRole === 'admin') {
        try {
          const chats = await Chat.find().sort({ lastMessageTime: -1 });
          socket.emit('chats_list', chats);
        } catch (error) {
          console.error('Error al obtener chats:', error);
        }
      }
    });


    socket.on('join_chat', async (chatId) => {
      if (socket.userRole === 'admin') {
        socket.join(`chat_${chatId}`);
        console.log(`Admin unido al chat ${chatId}`);
        try {
          const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
          socket.emit('chat_messages', messages);
        } catch (error) {
          console.error('Error al obtener mensajes:', error);
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en conexión de socket:', error);
    socket.emit('error', { message: 'Error en la conexión: ' + error.message });
  }

  socket.on('disconnect', () => {
    console.log(`❌ Usuario desconectado: ${socket.userName}`);
  });
});


server.listen(config.port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${config.port}`);
});