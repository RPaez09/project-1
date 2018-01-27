var app = {

  userModule : {

    username : localStorage.getItem('cryptoClash-name'),

    init: function(){

      if( !this.username ){ // if no username is saved
        $('#welcome-modal').modal('show'); // open the modal
        $('#welcome-modal').off('click'); // remove the background click event
        $('.modal-accept').on('click' , function(){
  
          var input = $('#nickname-input').val().trim();
  
          if( input != '' ){ // check if nickname is not empty
            app.userModule.username = input;
            localStorage.setItem('cryptoClash-name' , input); // saving username
            $('#welcome-modal').modal('hide');
          }
  
        });
      }

    }
  },

  priceHistoryModule : {

    init: function () {
      console.log("Price History Loaded");
    }
  },

  pollModule : {

    init: function () {
      console.log("Poll Module loaded");
    }
  },

  newsModule : {

    apiKey: apiKey,
    baseURL: "https://newsapi.org/v2/everything?q=", 

    topics: [
      "bitcoin",
      "ethereum",
      "ripple",
      "dogecoin"
    ],

    articles: {},

    init: function () {

      console.log("News module loaded");

      app.newsModule.topics.forEach(function(item) {

        app.newsModule.artGet(item);

      });

      console.log(app.newsModule.articles, "all topic results");

    },

    artGet: function(topic) {

      const queryURL = app.newsModule.baseURL + topic + "$from=2018-01-18&to=2018-01-25&sortBy=popularity&pageSize=10&apiKey=" + app.newsModule.apiKey;
      console.log(queryURL, "Query URL");

      $.ajax({
        url: queryURL,
        method: "GET"
      }).then(function(result) {

        const x = result.articles;

        Object.defineProperty(app.newsModule.articles, topic, {
          value: x
        });

      }).fail(function(err) {
        throw err;
      });

    },

    artDisplay: function() {

    }

  },

  chatModule : {

    socket : io(),

    chatHistory : [],

    init: function () {
      console.log("chat module loaded");

      $('form').submit(function () { // hook the chat form submit
        var newMessage = $('#m').val();

        if (newMessage != '') {
          newMessage = app.userModule.username + ": " + newMessage;
          app.chatModule.socket.emit('chat message', newMessage); 
          $('#m').val('');
        }

        return false;
      });

      app.chatModule.socket.on('chat message', function (msg) {
        app.chatModule.chatHistory.unshift(msg);

        if (app.chatModule.chatHistory.length > 50) {
          app.chatModule.chatHistory.splice(-1);
        }

        $('#messages').empty();

        for (let i = 0; i < app.chatModule.chatHistory.length; i++) {
          $('#messages').prepend($('<li>').text(app.chatModule.chatHistory[i]));
        }

      });

    }

  },

  startup : function(){

    this.userModule.init();
    this.priceHistoryModule.init();
    this.pollModule.init();
    this.newsModule.init();
    this.chatModule.init();

  }

}

app.startup(); // main entry point of this application