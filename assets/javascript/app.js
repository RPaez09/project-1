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

      var queryURL = 'http://hidden-savannah-78793.herokuapp.com/api/history/'+ this.activeCurrency;

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

    pollName: "Vote on your favourite cryptocurrency",
    pollState:0,
    init:function () {
      var fbConfig = {
      apiKey: apiKey.firebase,
      authDomain: "test-project-59866.firebaseapp.com",
      databaseURL: "https://test-project-59866.firebaseio.com",
      projectId: "test-project-59866",
      storageBucket: "test-project-59866.appspot.com",
      messagingSenderId: "766361558341"
    }
      firebase.initializeApp(fbConfig);
      var db = firebase.database(); 
      var voted = [];     
      db.ref().on('value',function(snapshot){
        app.pollModule.pollState = snapshot.val();
        //console.log(app.pollModule.pollState);
        app.pollModule.renderPolls(app.pollModule.pollState);
        voted=snapshot.child('voted').val();
        if (voted.indexOf(app.userModule.username)>=0){$('#pollForm').hide(); $('#poll-chart').show('200');}
        else{$('#poll-chart').hide(); $('#pollForm').show('200');}
      });
      $('#pollForm').submit(function(event){
        event.preventDefault();
        voted.push(app.userModule.username)
        db.ref('voted').set(voted);
        var vote = $('input[name=vote]:checked', this).val();
        console.log(vote);
        app.aniModule.renderScreen($('input[name=vote]:checked', this).attr('id'));
        app.priceHistoryModule.activeCurrency=vote;
        app.priceHistoryModule.getPrices();
        app.pollModule.pollState[vote]++;
        db.ref().set(app.pollModule.pollState);              
      });

      $(document).ready(function (){
        app.pollModule.renderPolls(app.pollModule.pollState);
      });

    },

    renderPolls: function (state) {

      var data = {
       labels: ["Bitcoin","Dogecoin","Ethereum","Ripple"],
       values: Object.getOwnPropertyNames(state).map(x => state[x]),
       type:'pie'
      };
      data = [data];

      var layout = {
        title: "Current Polls",
        showlegend: true,
        height: 290,
        autosize: true,
        margin: { t: 30 , l: 50 , r: 20 , b: 40 }
      }

      var options = {
        displayModeBar: false,
        scrollZoom: false
      }

      Plotly.newPlot( 'poll-chart', data , layout , options );

      $("#poll-header").html('Poll<em style="margin-left: 20px; font-size: 15px;">' + app.pollModule.pollName + '</em>');
    }
 
  },

  newsModule : {

    apiKey: apiKey.news,
    baseURL: "https://newsapi.org/v2/everything?language=en&q=", 

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

        const topic = $(this).text().toLowerCase();
        app.newsModule.artDisplay(topic);
        app.aniModule.renderScreen(topic);
        console.log(topic, "screen render");

      });

    },

    artGet: function(topic) {

      const toDate = moment().format("YYYY-MM-DD"),
            fromDate = moment().subtract(14, "days").format("YYYY-MM-DD");
            queryURL = app.newsModule.baseURL + topic + "$from=" + fromDate + "&to=" + toDate + "&sortBy=relevancy&pageSize=10&apiKey=" + app.newsModule.apiKey;

      $.ajax({
        url: queryURL,
        method: "GET"
      }).then(function(result) {

        const x = result.articles;

        Object.defineProperty(app.newsModule.articles, topic, {
          value: x
        });

        if(topic === "bitcoin") {
          app.newsModule.artDisplay("bitcoin");
        }

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
        img = $("<img>").addClass("article-img").attr("src", article.urlToImage),
        pAuth = $("<p>").addClass("article-author").text(article.author),
        pBod = $("<p>").addClass("article-body").html('<em>' + article.description + '</em>'),
        a = $("<a>").addClass("art_link").attr("href", article.url).attr("target", "_blank").html("<button class='accept article-btn'>View Article</button");

        div.append(h4);
        
        if( article.urlToImage ){ // check it the artcle has an image before appending
          div.append(img);
        }
        
        div.append(pAuth).append(pBod).append(a);

        $("#articles").append(div);

      }); 

      let divSrc = $("<div>").addClass("container").html("<p><em>Articles provided by Newsapi.org</em></p>");
      $("#articles").append(divSrc);

    }

  },

  chatModule : {

    socket : io(),

    parseMessage : function( msg ){
      return '<strong class="chat-user">'+ msg.name +':</strong> <span class="chat-message">' + msg.message + '</span>'
    },

    init: function () {
      $('#chatForm').submit(function (event) { // hook the chat form submit
        event.preventDefault();
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
          app.aniModule.quickRender(app.aniModule.currPreset);
        });

      }

  },

  aniModule: {

    currPreset: "bitcoin",

    presets: {

      bitcoin: {
        primary: "#f7931a",
        secondary: "#4d4d4d"
      },

      ethereum: {
        primary: "#3C3C3D",
        secondary: "#C99D66"
      },

      ripple: {
        primary: "#007a7b",
        secondary: "#d4fff6"
      },

      dogecoin: {
        primary: "#e1b303",
        secondary: "#000000"
      },
      
    },

    init: function() {

      app.aniModule.renderScreen("start");

    },

    renderScreen: function(x) {

      if(x === "start") {

        console.log("Bitcoin color scheme already in place");

      } else if(app.aniModule.presets[x] != undefined) {

        app.aniModule.currPreset = x;

        const a = $(".navbar"),
              b = $("#messages li:nth-child(odd)"),
              c = $("#footer"),
              d = $(".navbar-brand"),
              e = $(".nav-link.topic-tab"),
              f = $(".section-header");
              
        TweenMax.to(a, 1, {
          backgroundColor: app.aniModule.presets[x].primary,
          color: app.aniModule.presets[x].secondary });
        TweenMax.to(b, 1, {
          backgroundColor: app.aniModule.presets[x].primary,
          color: app.aniModule.presets[x].secondary });
        TweenMax.to(c, 1, {
          backgroundColor: app.aniModule.presets[x].primary,
          color: app.aniModule.presets[x].secondary });
        TweenMax.to(d, 1, {
          color: app.aniModule.presets[x].secondary });
        TweenMax.to(d, 1, {
          color: app.aniModule.presets[x].secondary });
        TweenMax.to(e, 1, {
          color: app.aniModule.presets[x].secondary });
        TweenMax.to(f, 1, {
          backgroundColor: app.aniModule.presets[x].primary,
          color: app.aniModule.presets[x].secondary });

      } else {

        console.log(x + "is not an available preset");
        app.aniModule.renderScreen("bitcoin");

      }

    },

    quickRender: function(x) {
      $("#messages li:nth-child(odd)").attr("style", "background-color: " + app.aniModule.presets[x].primary + "; color: " + app.aniModule.presets[x].secondary + ";");
    }

  },

  startup : function(){

    this.userModule.init();
    this.priceHistoryModule.init();
    this.pollModule.init();
    this.newsModule.init();
    this.chatModule.init();
    this.aniModule.init();

    var tl = new TimelineLite();

    tl.add( TweenLite.from( $('.section-ticker')  , .5, { ease: Power2.easeInOut , y: 50, opacity: 0 , delay: 0.4 } ) );
    tl.add( TweenLite.from( $('.section-poll')    , .5, { ease: Power2.easeInOut , y: 50, opacity: 0 }, "-=0.7" ) );
    tl.add( TweenLite.from( $('.section-articles'), .5, { ease: Power2.easeInOut , y: 50, opacity: 0 }, "-=0.7" ) );
    tl.add( TweenLite.from( $('.section-chat')    , .5, { ease: Power2.easeInOut , y: 50, opacity: 0 }, "-=0.7" ) );

  }

};

app.startup(); // main entry point of this application