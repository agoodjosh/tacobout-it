$(document).ready(initializeApp);

function initializeApp() {
	controller.getLocation();
	view.initiateClickHandlers();
	controller.tacoTuesdayCountdown(model.currentDate);
	controller.createTacoRecipe();
}

//====================================================//
//==================== MODEL =========================//
//====================================================//

var model = {
    i: 0,
    infoWindow: null,
    resultsArr: null,
    searchLocation: null,
    geolocation: false,
    service: null,
    currentDate: new Date(),
    loc: null,
    searchRadius: 2414,
    playSounds: true,
    int: null,

    imgAPICall: function (query, ele) {
        var ajaxOptions = {
            method: "GET",
            url: `https://api.flickr.com/services/rest?method=flickr.photos.search&api_key=3fc073b0106c2754cfcfda60ff2ea8ba&format=json&nojsoncallback=1&text=${query}&per_page=10`,
            error: function (data) {
                view.appendImg(ele, "https://i.imgur.com/iTuHMPB.png");
            }
        };

        $.ajax(ajaxOptions).then(
            controller.tacoImageFilter.bind(null, ele, query)
        );
    },
    getPlaceDetails: function () {
        var first = true;
        clearInterval(model.int);

        if (model.resultsArr[0]){
            function getAdditionalPlaceDetails() {
                model.service.getDetails(
                    {
                        placeId: model.resultsArr[model.i].place_id,
                    },
                    function (place) {
                        model.resultsArr[model.i].simonsData = place;
                        if (model.i === model.resultsArr.length - 1) {
                            clearInterval(model.int);
                            view.initList();
                        }
                    }
                );
            }
            model.int = setInterval(function () {
                model.i++;
                if (first) {
                    first = false;
                    model.i = 0;
                    getAdditionalPlaceDetails();
                } else if (model.i > model.resultsArr.length - 1) {
                    model.i = 0;
                } else {
                    getAdditionalPlaceDetails();
                }

            }, 500);
        } else {
            view.noPlacesFound();
        }
    },
    geocode: function () {
        $.ajax({
            url: 'https://maps.googleapis.com/maps/api/geocode/json?address=' + model.loc + '&key=AIzaSyDmBiq2uv9zLd2A1G5KwCbSaUYhMwO6mJg',
            method: 'get',
            cache: false,
            dataType: 'json',
            success: function (data) {
                if (data.status === 'OK'){
                    model.searchLocation = data.results[0].geometry.location;
                    view.initMap();
                } else {
                    clearInterval(model.int);
                    view.noPlacesFound();
                }
            }
        })
    },
    handleZipcodeInput: function () {

        view.addLoadingPlacesSpinner();
        view.disableListToggle();

        if ($('#searchRadiusInput').val() !== '') {
            let miles = Number($('#searchRadiusInput').val());
            if (miles > 10){
                miles = 10;
            } else if (miles < 1){
                miles = 1;
            }
            let meters = miles * 1609.34;
            model.searchRadius = meters;
        }

        if ($('#zipcodeSearch').val() !== '') {
            model.loc = $('#zipcodeSearch').val();
            model.geocode();
        } else {
            controller.getLocation();

            if (this.geolocation){
                view.initMap();
            }
        }
    }
};

//====================================================//
//===================== VIEW =========================//
//====================================================//

var view = {
    initiateClickHandlers: function () {
        $(".makeBtn").on("click", this.showRecipeModal);
        $(".findBtn").on("click", controller.loadSearchTacoModal.bind(controller));
        $(".recipeModalFrontHome").on("click", this.hideRecipeModal);
        $(".recipeModalBackHome").on("click", this.hideRecipeModalBack);
        $(".searchModalReturn").on("click", this.hideSearchModal);
        $('.searchModalExpandToggle').on('click', this.toggleSearchModalExpand);
        $(".recipeModalReturn").on("click", this.flipRecipeModalToFront);
        $(".recipeModalGetNew").on("click", controller.createTacoRecipe.bind(controller));
        $('.modalButton').on('click', this.btnClickSound);
        $('.zipcodeBtn').on('click', model.handleZipcodeInput);
        $('#homeImg').on('click', this.fadeout);
        $('.sfxBtn').on('click', this.toggleSounds);
        $('.recipeImage img')[0].onerror = function () { this.appendImg($('.recipeImage img'), "https://i.imgur.com/iTuHMPB.png") }.bind(this)
    },
    toggleSounds: function () {
        if (model.playSounds) {
            $('.sfxBtn').empty();
            $('.sfxBtn').append('<i class="fas fa-volume-off"></i>');
            model.playSounds = false;
        } else {
            $('.sfxBtn').empty();
            $('.sfxBtn').append('<i class="fas fa-volume-up"></i>');
            model.playSounds = true;
        }
    },
    btnClickSound: function () {
        if (model.playSounds) {
            var crunchSound = new Audio("sounds/crunch_sound.mp3");
            crunchSound.play();
        }
    },
    showRecipeModal: function () {
        $(".recipeModalContainer").css("top", "0");
        view.btnClickSound();
    },
    flipRecipeModalToFront: function () {
        $('.recipeModalContainer').css('transform', 'translate(-50%, 0) rotateY(0deg)');
        $('.recipeModalFront').show();
        setTimeout(function () {
            $('.recipeModalBack').hide();
        }, 500)
    },
    flipRecipeModalToBack: function () {
        $('.recipeModalContainer').css('transform', 'translate(-50%, 0) rotateY(180deg)');
        $('.recipeModalBack').show();
        setTimeout(function () {
            $('.recipeModalFront').hide();
        }, 500)
    },
    hideRecipeModal: function () {
        $(".recipeModalContainer").attr("style", "top: -250%");
    },
    hideRecipeModalBack: function () {
        $(".recipeModalContainer").css({
            top: '-250%',
            transform: 'translate(-50%, 0) rotateY(180deg)'
        });
    },
    showSearchModal: function () {
        $(".searchModalContainer").css("top", "0");
        view.btnClickSound();
    },
    hideSearchModal: function () {
        $(".searchModalContainer").attr("style", "top: -250");
    },
    toggleSearchModalExpand: function () {
        if ( $('.placesList').children()[0].className === 'listItem' ) {
            $('.searchModal').children().toggleClass('map-expand');
            var icon = $('.searchModalExpandToggle').children();
            icon.toggleClass('fa-caret-down');
            icon.toggleClass('fa-caret-up');
        }
    },
    addLoadingPlacesSpinner: function() {
        $('.placesList  div').remove();
        var catImg = $("<img>").attr("src", "images/taco_cat.gif");
		var tacoImg = $("<img>").attr("src", "images/taco_load.png");
		var loader = $("<div>")
			.addClass("loader")
			.append(catImg, tacoImg);
		$(".placesList").append(loader);
    },
    initMap: function () {
        this.addLoadingPlacesSpinner();

        model.map = new google.maps.Map(document.getElementById('map'), {
            center: model.searchLocation,
            zoom: 12,
            gestureHandling: 'greedy',
        });

        model.infoWindow = new google.maps.InfoWindow();
        model.service = new google.maps.places.PlacesService(model.map);
        model.service.nearbySearch({
            location: model.searchLocation,
            radius: model.searchRadius,
            keyword: ('taco+mexican'),
            type: ('restaurant')
        }, view.storeResultsAndCallMarkers);
    },
    storeResultsAndCallMarkers: function (results, status) {
        model.resultsArr = results;
        model.getPlaceDetails();
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            for (var i = 0; i < results.length; i++) {
                view.createMarker(results[i]);
            }
        }
    },
    createMarker: function createMarker(place) {
        var marker = new google.maps.Marker({
            map: model.map,
            position: place.geometry.location,
            icon: "images/taco_purp_marker.png",
        });
        $(".mapContainer > .loader").remove();

        google.maps.event.addListener(marker, "click", function () {
            model.infoWindow.setContent(place.name);
            model.infoWindow.open(model.map, this);
        });
    },
    changeRecipeModalHeader: function (headerText, element) {
        element.text(headerText);
    },
    appendImg: function (ele, imgLink) {
        ele.attr("src", imgLink);
    },
    clearRecipeModalText: function (element) {
        element.empty();
    },
    addRecipeModalLinks: function (linksArray) {
        let linkElements = [];
        for (let i = 0; i < linksArray.length; i++) {
            let linkElement = $('<p>', {
                text: "Recipe for " + linksArray[i].name,
                'class': 'recipeLinks',
            });
            // using closure to connect the links I'm making with the appropriate recipe object
            (function () {
                linkElement.on('click', openAndShowComponentRecipe.bind(view));
                function openAndShowComponentRecipe() {
                    this.clearRecipeModalText($('.recipeTextBack p'));
                    this.changeRecipeModalHeader(linksArray[i].name, $('.recipeTextBack h2'));
                    let gleanedRecipe = controller.gleanRecipe(linksArray[i].recipe);
                    this.addRecipeModalText(gleanedRecipe, $('.recipeTextBack p'));
                    this.flipRecipeModalToBack();
                }
            })();

            linkElements.push(linkElement);

        }
        $('.recipeTextFront p').append(linkElements);
    },
    addRecipeModalText: function (textArray, element) {
        let textTagsArray = [];
        for (let i = 0; i < textArray.length; i++) {
            let textNode = $('<p>').text(textArray[i]);
            textTagsArray.push(textNode);
        }
        element.append(textTagsArray);
    },
    initList: function () {

        for (var i = 0; i < model.resultsArr.length; i++) {
            var elementsList = [];

            var newDiv = $('<div>').addClass('listItem');

            if (model.resultsArr[i].hasOwnProperty('photos')) {
                var imgContainer = $('<div>').addClass('imgContainer');
                var img = $('<img>').attr('src', model.resultsArr[i].photos[0].getUrl({
                    'maxWidth': 100,
                    'maxHeight': 100
                })).addClass('image');

            } else {
                var imgContainer = $('<div>').addClass('imgContainer');
                var img = $('<img>').attr('src', './images/taco_default2.jpg').css({
                    'maxWidth': 100,
                    'maxHeight': 100
                }).addClass('image');
            }
            imgContainer.append(img);
            elementsList.push(imgContainer);
            if (model.resultsArr[i].name.length > 24 && model.resultsArr[i].hasOwnProperty('photos')) {

                var storeName = controller.nameTruncate(model.resultsArr[i].name);

                var name = $('<h2>').text(storeName).addClass('name makeMeSmaller');
                elementsList.push(name);
            } else {
                var name = $('<h2>').text(model.resultsArr[i].name).addClass('name');
                elementsList.push(name);
            }
            if (model.resultsArr[i].hasOwnProperty('rating')) {
                var rating = $('<div>').text(model.resultsArr[i].rating).addClass('rating');
                elementsList.push(rating)
            }
            if (model.resultsArr[i].hasOwnProperty('simonsData')) {
                if (model.resultsArr[i].simonsData.hasOwnProperty('formatted_phone_number')) {
                    var phoneNumber = $('<h4>').text(model.resultsArr[i].simonsData.formatted_phone_number).addClass('phoneNumber');
                    elementsList.push(phoneNumber);
                }
            } else {
                var phoneNumber = $('<h4>').addClass('phoneNumber');
                elementsList.push(phoneNumber);
            }
            if (model.resultsArr[i].hasOwnProperty('opening_hours')) {
                if (model.resultsArr[i].opening_hours.open_now) {
                    var insert = 'Open';
                } else {
                    var insert = 'Closed';
                }
                var openQuery = $('<h4>').text(insert).addClass(insert.toLowerCase());
                elementsList.push(openQuery)
            }
            var directionsLink = $('<h3>');
            var link = $('<a>').attr('href', 'https://www.google.com/maps/place/?q=place_id:' + model.resultsArr[i].place_id).text('Get Directions');
            $(directionsLink).append(link);

            elementsList.push(directionsLink);

            if (elementsList.length > 1) {
                $(newDiv).append(elementsList);
                $(".placesList > .loader").remove();
                $('.placesList').append(newDiv);
            }
        }
        
        if (model.resultsArr.length){
            view.enableListToggle();
        }
    },
    enableListToggle: function(){
        $('.searchModalExpandToggle').addClass('enabled').attr('disabled', false);
    },
    disableListToggle: function(){
        $('.searchModalExpandToggle').removeClass('enabled').attr('disabled', true);
    },
    noPlacesFound: function(){
        var errorTextDiv = $('<div>',{
            text: 'No restaurants found based off of given location and/or search radius',
            'class': 'emptyPlacesList'
        })
        $('.placesList').empty().append(errorTextDiv);
    },
    tacoTuesdayTimer: function (d, h, m, s) {
        $("#tacoTuesday").empty();
        let timer = d + "d " + h + "h " + m + "m " + s + "s" + " 'til Taco Tuesday";
        $("#tacoTuesday").append(timer);
    },
    tacoTuesdayAnnounce: function (str) {
        $("#tacoTuesday").empty();
        $("#tacoTuesday").text(str);
    }
};

//====================================================//
//==================== CONTROLLER ====================//
//====================================================//

var controller = {
    nameTruncate: function (str, length, ending) {
        if (length == null) {
            length = 24;
        }
        if (ending == null) {
            ending = '...';
        }
        if (str.length > length) {
            return str.substring(0, length - ending.length) + ending;
        } else {
            return str;
        }
    },
    getLocation: function () {
        view.addLoadingPlacesSpinner();

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(controller.showPosition, view.noPlacesFound);
            model.geolocation = true;
        } 
    },
    showPosition: function (position) {
        model.searchLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        view.initMap();
    },
    createTacoRecipe: function () {
        var getTacoOptions = {
            dataType: "json",
            method: "get",
            url: "https://taco-randomizer.herokuapp.com/random/?full-taco=true"
        };

        $.ajax(getTacoOptions).then(controller.tacoDataObtained.bind(this));
    },
    tacoDataObtained: function (data) {
        let tacoName = this.getSpecificTacoName(data.name);
        let gleanedRecipe = this.gleanRecipe(data.recipe);
        let layersArray = [];

        view.changeRecipeModalHeader(tacoName, $('.recipeTextFront h2'));
        model.imgAPICall(tacoName, $(".recipeImage img"));
        view.clearRecipeModalText($('.recipeTextFront p'));

        if (data.base_layer) {
            layersArray.push(data.base_layer);
        }
        if (data.condiment) {
            layersArray.push(data.condiment);
        }
        if (data.mixin) {
            layersArray.push(data.mixin);
        }
        if (data.shell) {
            layersArray.push(data.shell);
        }
        view.addRecipeModalLinks(layersArray);
        view.addRecipeModalText(gleanedRecipe, $('.recipeTextFront > p'));
    },

    getSpecificTacoName: function (longName) {
        let endPoint = longName.indexOf(",");
        if (endPoint === -1) {
            return longName;
        }
        let shortName = longName.substr(0, endPoint) + " Tacos";
        return shortName;
    },

    tacoImageFilter: function (ele, query, data) {
        var qArray = data.photos.photo;
        var photoFound = false;

        for (var qI = 0; qI < qArray.length; qI++) {
            if (qArray[qI].title.indexOf("aco") !== -1) {
                view.appendImg(ele, `https://farm${qArray[qI].farm}.staticflickr.com/${qArray[qI].server}/${qArray[qI].id}_${qArray[qI].secret}.jpg`);
                photoFound = true;
            }
        }
        if (!photoFound){
            view.appendImg(ele, "https://i.imgur.com/iTuHMPB.png");
        }
    },

    gleanRecipe: function (recipe) {
        let gleanedRecipe = recipe.replace(/[#*-=]|\./g, '');
        gleanedRecipe = gleanedRecipe.split('\n');

        for (let i = 0; i < gleanedRecipe.length; i++) {
            if (gleanedRecipe[i] === '') {
                gleanedRecipe.splice(i, 1);
                i--;
            } else if (gleanedRecipe[i].indexOf('(') !== -1) {
                gleanedRecipe[i] = gleanedRecipe[i].substr(0, gleanedRecipe[i].indexOf('('));
            }
        }

        return gleanedRecipe;
    },

    loadSearchTacoModal: function () {
        view.showSearchModal();
    },

    //countdown timer from https://www.w3schools.com/howto/howto_js_countdown.asp
    tacoTuesdayCountdown: function (date) {
        if (date.getDay() !== 2) {
            date.setDate(date.getDate() + (2 + 7 - date.getDay()) % 7);
            date.setHours(0, 0, 0);
            // Set the date we're counting down to
            var countDownDate = new Date(date).getTime();
            // Update the count down every 1 second
            var x = setInterval(function () {
                // Get todays date and time
                var now = new Date().getTime();
                // Find the distance between now an the count down date
                var distance = countDownDate - now;
                // Time calculations for days, hours, minutes and seconds
                var days = Math.floor(distance / (1000 * 60 * 60 * 24));
                var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                var seconds = Math.floor((distance % (1000 * 60)) / 1000);
                // Output the result
                view.tacoTuesdayTimer(days, hours, minutes, seconds);
            }, 1000);
        } else {
            view.tacoTuesdayAnnounce("IT'S TACO TUESDAY!");
        }

    }
};
