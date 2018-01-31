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

    activeCurrency: 'BTC',

    data: '',

    getPrices: function( ){

      var queryURL = 'http://localhost:8080/api/history/'+ this.activeCurrency;

      $.ajax({
        url: queryURL,
        method: "GET"
      }).then(function(result) {

      app.priceHistoryModule.data = result;
      app.priceHistoryModule.renderPrices();

      }).fail(function(err) {
        throw err;
      });
    },

    renderPrices: function( ){
      var chartLine = {
        x: [],
        y: [],
        type: 'scatter'
      };

      for( var i = 0; i < this.data.length; i++ ){
        var date = moment.unix( this.data[i].date );
        chartLine.x.push( date.format('YYYY-M-D') );
        chartLine.y.push( this.data[i].price );
      }

      var data = [chartLine]

      var layout = {
        title: this.activeCurrency + " prices in the last week",
        showlegend: false,
        height: 290,
        autosize: true,
        margin: { t: 30 , l: 50 , r: 20 , b: 50 }
      }

      var options = {
        displayModeBar: false,
        scrollZoom: false
      }

      Plotly.newPlot( 'price-chart', data , layout , options );
    },

    init: function () {
      this.getPrices('BTC');

      $(window).on('resize' , function(){
        app.priceHistoryModule.renderPrices();
      });

      $('.topic-tab').on('click' , function(e){
        var ticker = $(e.target).attr('data-coin');
        app.priceHistoryModule.activeCurrency = ticker;
        app.priceHistoryModule.getPrices();
      });
    },


  },

  pollModule : {

    init: function () {

      var fbConfig = {
        apiKey: apiKey.firebase,
        authDomain: "test-project-59866.firebaseapp.com",
        databaseURL: "https://test-project-59866.firebaseio.com",
        projectId: "test-project-59866",
        storageBucket: "test-project-59866.appspot.com",
        messagingSenderId: "766361558341"
      };
      firebase.initializeApp(fbConfig);
      var db = firebase.database();
      var pollState;
      db.ref().on('value',function(snapshot){
        pollState = snapshot.val();
        console.log(pollState);
      });
      $('#pollForm').submit(function(event){
        event.preventDefault;
        var vote = $('input[name=vote]:checked', this).val();
        console.log(vote);
        pollState[vote]++;
        db.ref().set(pollState);
        this.hide();
      });

    }
    
  },

  newsModule : {

    apiKey: apiKey.news,
    baseURL: "https://newsapi.org/v2/everything?q=", 

    topics: [
    "bitcoin",
    "ethereum",
    "ripple",
    "dogecoin"
    ],

    // stores articles pulled from ajax call as properties under the topic name
    articles: {},

    init: function () {

      app.newsModule.topics.forEach(function(item) {

        app.newsModule.artGet(item);

      });

      // listens for topic link selection, then renders appropriate articles
      $(".topic-tab").on("click", function() {

        topic = $(this).text().toLowerCase();
        app.newsModule.artDisplay(topic);

      });

    },

    artGet: function(topic) {

      const toDate = moment().format("YYYY-MM-DD"),
            fromDate = moment().subtract(12, "days").format("YYYY-MM-DD");

      const queryURL = app.newsModule.baseURL + topic + "$from=" + fromDate + "&to=" + toDate + "&sortBy=popularity&pageSize=10&apiKey=" + app.newsModule.apiKey;

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

    artDisplay: function(x) {

      const arrX = app.newsModule.articles[x];

      $("#articles").empty();

      arrX.forEach(function(article) {

        let div = $("<div>").addClass("container article"),

            h4 = $("<h4>").text(article.title),
            img = $("<img>").addClass("img_article").attr("src", article.urlToImage),
            pAuth = $("<p>").text(article.author),
            pBod = $("<p>").html('<em>' + article.description + '</em>'),
            a = $("<a>").addClass("art_link").attr("href", article.url).attr("target", "_blank").text("Link to article");

        div.append(h4).append(img).append(pAuth).append(pBod).append(a);

        $("#articles").append(div);

      }); 

      let pSrc = $("<p>").html("<em>Articles provided by Newsapi.org</em>");
      $("#articles").append(pSrc);

    }

  },

  chatModule : {

    socket : io(),

    parseMessage : function( msg ){
      return '<strong>'+ msg.name +':</strong> ' + msg.message
    },

    init: function () {
      $('#chatForm').submit(function (event) { // hook the chat form submit
        event.preventDefault;
        var newMessage = $('#m').val();

        if (newMessage != '') {
          newMessage = 
          { 
            'name' : app.userModule.username, 
            'message' : newMessage
          }
          app.chatModule.socket.emit('chat message', newMessage); 
          $('#m').val('');
        }

        return false;
      });

      //get all messages and populate message history
      $.get( "http://hidden-savannah-78793.herokuapp.com/api/messages/", function( response ) {
        return response }).done(function( data ){
          for( var i = 0; i < data.length; i++ ){
            $('#messages').prepend($('<li>').html( app.chatModule.parseMessage( data[i] ) ));
          }
          $('#message-display').scrollTop(9999999);
        })

        app.chatModule.socket.on('chat message', function (msg) {
          $('#messages').append($('<li>').html( app.chatModule.parseMessage( msg ) ));
          $('#message-display').scrollTop(9999999);
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