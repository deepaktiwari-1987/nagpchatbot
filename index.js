// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const functions = require('firebase-functions');
const { dialogflow, Suggestions, Permission, Table } = require('actions-on-google');
const { 
    v4: uuidv4,
  } = require('uuid');


const locationList = ['Delhi','Mumbai', 'Goa', 'Banglore','Lucknow', 'Hyderabad'];
const dateList = ['Today', 'Tomorrow', '3 days after today','Enter date'];
const bookingTypes = ['Book Train Ticket', 'Rent Car'];
const noTrainAvailableSuggestions = ['Change Date', 'Change Destination','Start Over'];
const travelClasses = ['EC','1AC','2AC','3AC','Change destination','Start Over'];
const yesNoSelections = ['Yes','No'];
const rentCarDateList = ['Today','Tomorrow'];
const availableCarsForRent = ['Ford Mondeo','Honda CRV'];
const userTrainBookedTimes = {};

const app = dialogflow({debug: false});

app.intent('MyTravelPlanner.Welcome', conv => {

 conv.add('Hi, I am your travel planner.You can ask me to book your train ticket(s) and car rental');
 conv.ask(new Suggestions(bookingTypes));
})

app.intent('MyTravelPlanner.TrainTicketJourneyStart', (conv, params, permissionGranted) => {
    console.log('==========MyTravelPlanner.TrainTicketJourneyStart=====')
    /*console.log('========= Input Contexts ============')
    console.log(conv.contexts.input);
    console.log(conv.contexts.input.trainjourneystartcntxt?.parameters);
    console.log('========= Parameter Contexts ============')
    console.log(conv.body.queryResult.parameters);*/
    
    if (isEmpty(conv.parameters.origin)) {
        const originLocationData = locationList.concat([]);
        if(conv.query!=='actions_intent_PERMISSION') {
            conv.data.requestedPermission = "DEVICE_PRECISE_LOCATION";
            return conv.ask(
                new Permission({
                  context: "Location user permission",
                  permissions: conv.data.requestedPermission
                })
              );
        } else if(conv.query==='actions_intent_PERMISSION' && permissionGranted) {
            const { requestedPermission } = conv.data;
            if (requestedPermission === "DEVICE_PRECISE_LOCATION") {
                const { city } = conv.device.location;
                if(city) {
                    originLocationData.push(city);
                }
            }
        }
        conv.add('Whats the origin of train?');
        conv.ask(new Suggestions(originLocationData));
    } else if (isEmpty(conv.parameters.destination)) {
        console.log(conv.parameters)
        console.log(conv.contexts.input.trainjourneystartcntxt?.parameters)
        const originCity = conv.parameters.origin.city || conv.parameters.origin['admin-area']
        const destinationLocations = locationList.filter(location => location!=originCity)
        conv.add('Whats the destination of train?');
        conv.ask(new Suggestions(destinationLocations));
    }else {
        conv.add('For when do you want to book the train tickets?');
        conv.ask(new Suggestions(dateList));
    }
});


/*app.intent("get_currentlocation", (conv, params, permissionGranted) => {
    console.log('==========get_currentlocation=====')
    if (permissionGranted) {
      const { requestedPermission } = conv.data;
      let address;
      if (requestedPermission === "DEVICE_PRECISE_LOCATION") {
        const { coordinates } = conv.device.location;
        console.log('coordinates are', conv.device.location);
  
        if (coordinates && address) {
          return conv.close(new SimpleResponse(`Your Location details ${address}`));
        } else {
          // Note: Currently, precise locaton only returns lat/lng coordinates on phones and lat/lng coordinates
          // and a geocoded address on voice-activated speakers.
          // Coarse location only works on voice-activated speakers.
          return conv.close("Sorry, I could not figure out where you are.");
        }
      }
    } else {
      return conv.close("Sorry, permission denied.");
    }
  });*/


app.intent('MyTravelPlanner.TrainTicket.SelectTravelDate', conv => {
    console.log('==========MyTravelPlanner.TrainTicket.SelectTravelDate=====')
    console.log('========= Parameter Contexts ============')
    console.log(conv.parameters);
    /*console.log('========= Input Contexts ============')
    console.log(conv.contexts.input);
    console.log(conv.contexts.input.trainjourneystartcntxt?.parameters);
    console.log('========= Parameter Contexts ============')
    console.log(conv.body.queryResult.parameters);*/

    const currentDate = new Date()
    const day = ('0' + (currentDate.getDate()+1)).slice(-2)
    const month = ('0' + (currentDate.getMonth())).slice(-2)
    const year = currentDate.getFullYear()
    const tomorrowDate = `${year}-${month}-${day}`;


    if(conv.parameters.trainDate==='') {
        //conv.contexts.set(contextData)
        conv.ask('Please enter date of travel');
    }else if(conv.parameters.trainDate.indexOf(tomorrowDate)===0) {
        conv.add('No trains are available for tomorrow');
        conv.ask(new Suggestions(noTrainAvailableSuggestions));
    }else {
        conv.add('Which class do you want to travel');
        conv.ask(new Suggestions(travelClasses));
    }
    
});

// Tomorrow selection cases handle
app.intent('MyTravelPlanner.TrainTicket.SelectTravelDate - Change Date', conv => {
    console.log('==========MyTravelPlanner.TrainTicket.SelectTravelDate - Change Date=====')
    /*console.log('========= Input Contexts ============')
    console.log(conv.contexts.input);
    console.log(conv.contexts.input.trainjourneystartcntxt?.parameters);
    console.log('========= Parameter Contexts ============')
    console.log(conv.body.queryResult.parameters);*/
    conv.add('For when do you want to book the train tickets?');
    conv.ask(new Suggestions(dateList));
});

app.intent('MyTravelPlanner.TrainTicket.SelectTravelDate - Change Destination', conv => {
    console.log('==========MyTravelPlanner.TrainTicket.SelectTravelDate - Change Destination=====')
    /*console.log('========= Input Contexts ============')
    console.log(conv.contexts.input);
    console.log(conv.contexts.input.trainjourneystartcntxt?.parameters);
    console.log('========= Parameter Contexts ============')
    console.log(conv.body.queryResult.parameters);*/
    const trainJourneyStartContext = conv.contexts.input.trainjourneystartcntxt?.parameters;
    if (isEmpty(conv.parameters.destination)) {
        const originCity = trainJourneyStartContext['origin.original']
        const destinationLocations = locationList.filter(location => location!=originCity)
        conv.add('Whats the destination of train?');
        conv.ask(new Suggestions(destinationLocations));
    } else {
        conv.add('For when do you want to book the train tickets?');
        conv.ask(new Suggestions(dateList));
    }
});

app.intent('MyTravelPlanner.TrainTicket.SelectTravelDate - Start Over', conv => {
    console.log('==========MyTravelPlanner.TrainTicket.SelectTravelDate - Start Over=====')
    /*console.log('========= Input Contexts ============')
    console.log(conv.contexts.input);
    console.log(conv.contexts.input.trainjourneystartcntxt?.parameters);
    console.log('========= Parameter Contexts ============')
    console.log(conv.body.queryResult.parameters);*/
    conv.followup('TRAIN_TICKET_JOURNEY_START');
});

// End of Tomorrow selection cases handle

/*app.intent('MyTravelPlanner.TrainTicket.SelectTravelDate - Enter Date', conv => {
    console.log('==========MyTravelPlanner.TrainTicket.SelectTravelDate - Start Over=====')
    /*console.log('========= Input Contexts ============')
    console.log(conv.contexts.input);
    console.log(conv.contexts.input.trainjourneystartcntxt?.parameters);
    console.log('========= Parameter Contexts ============')
    console.log(conv.body.queryResult.parameters);*/
    /*const trainDate = conv.parameters.trainDate;
    const selectedDate = new Date(conv.parameters.customTravelDate);
    /*if (!isEmpty(trainDate)) {
        if(selectedDate.toString()==='Invalid Date') {

        }
    }*/
/*});*/


app.intent('MyTravelPlanner.TrainTicket.SelectTravelDate.SelectTravelClass', conv => {
    console.log('==========MyTravelPlanner.TrainTicket.SelectTravelDate.SelectTravelClass=====')
    /*console.log('========= Input Contexts ============')
    console.log(conv.contexts.input);
    console.log(conv.contexts.input.trainjourneystartcntxt?.parameters);
    console.log('========= Parameter Contexts ============')
    console.log(conv.body.queryResult.parameters);*/
    const travelClass = conv.parameters.travelClass;
    if(travelClass!=='Change destination' && travelClass!=='Start Over') {
        conv.add('Do you want to select seats?');
        conv.ask(new Suggestions(yesNoSelections));
    } /*else {
        conv.followup('TRAIN_TICKET_JOURNEY_START',{origin: trainJourneyStartContext.origin, destination: trainJourneyStartContext.destination})
    }*/
})

app.intent('MyTravelPlanner.TrainTicket.SelectTravelDate.SelectTravelClass - yes', conv => {
    console.log('==========MyTravelPlanner.TrainTicket.SelectTravelDate.SelectTravelClass - yes=====')
    /*console.log('========= Input Contexts ============')
    console.log(conv.contexts.input);
    console.log(conv.contexts.input.trainjourneystartcntxt?.parameters);
    console.log('========= Parameter Contexts ============')
    console.log(conv.body.queryResult.parameters);*/
    const seatNumber = conv.parameters.seatNumber;
    const trainJourneyStartContext = conv.contexts.input.trainjourneystartcntxt?.parameters;
    const travelClassContext = conv.contexts.input.travelclasscntx?.parameters;
    if(isEmpty(seatNumber)) {
        const originCity = trainJourneyStartContext['origin.original']
        const destinationCity = trainJourneyStartContext['destination.original']
        const msgToShow = `Awesome please select your seats for train from ${originCity} to ${destinationCity} for ${travelClassContext.travelClass}`;
        conv.ask(msgToShow);
        let rows = [];
        let headers = ['A |','B |','C |']
        for(let i=1;i<=3;i++) {
            let rowCells = [{"text":headers[i-1]}];
            for(let j=1;j<=6;j++) {
                rowCells.push({"text": j.toString()})
            }
            rows.push({"cells": rowCells})
        }
        conv.ask(new Table({
            "dividers":true,
            "subtitle" : " ",
            "title": msgToShow,
            "columns":[" "],
            "rows": rows
        }));
    } else {
        conv.add('Awesome Please complete payment by clicking here');
        conv.ask(new Suggestions(['Payment Completed']));
    }
})

app.intent('MyTravelPlanner.TrainTicket.SelectTravelDate.SelectTravelClass - no', conv => {
    console.log('==========MyTravelPlanner.TrainTicket.SelectTravelDate.SelectTravelClass - no=====')
    /*console.log('========= Input Contexts ============')
    console.log(conv.contexts.input);
    console.log(conv.contexts.input.trainjourneystartcntxt?.parameters);
    console.log('========= Parameter Contexts ============')
    console.log(conv.body.queryResult.parameters);*/
    conv.add('Awesome Please complete payment by clicking here');
    conv.ask(new Suggestions(['Payment Completed']));
})

app.intent('MyTravelPlanner.TrainTicketJourneyEnd', conv => {
    console.log('==========MyTravelPlanner.TrainTicketJourneyEnd=====')
    /*console.log('========= Input Contexts ============')
    console.log(conv.contexts.input);
    console.log(conv.contexts.input.trainjourneystartcntxt?.parameters);
    console.log('========= Parameter Contexts ============')
    console.log(conv.body.queryResult.parameters);*/
    conv.add(`Thank you for your payment!! Your tickets have been booked and your booking ID is ${uuidv4()} Do you want to rent a car also?`);
    userTrainBookedTimes[conv.id]=new Date();
    conv.ask(new Suggestions(yesNoSelections));
})

app.intent('MyTravelPlanner.TrainTicketJourneyEnd - no', conv => {
    console.log('==========MyTravelPlanner.TrainTicketJourneyEnd - no=====')
    /*console.log('========= Input Contexts ============')
    console.log(conv.contexts.input);
    console.log(conv.contexts.input.trainjourneystartcntxt?.parameters);
    console.log('========= Parameter Contexts ============')
    console.log(conv.body.queryResult.parameters);*/
    conv.close(`Have a great journey`);
})

// Connect travel train to car rental
app.intent('MyTravelPlanner.RentCar.TrainJourneyEnd.SelectRentCar', conv => {
    console.log('==========MyTravelPlanner.RentCar.TrainJourneyEnd.SelectRentCar=====')
    /*console.log('========= Input Contexts ============')
    console.log(conv.contexts.input);
    console.log(conv.contexts.input.trainjourneystartcntxt?.parameters);
    console.log('========= Parameter Contexts ============')
    console.log(conv.body.queryResult.parameters);*/
    conv.add(`Please select from below available cars.`);
    conv.ask(new Suggestions(availableCarsForRent));
})

/*app.intent('MyTravelPlanner.TrainTicketJourneyEnd - yes', conv => {
    console.log('==========MyTravelPlanner.TrainTicketJourneyEnd - yes=====')
    console.log('========= Input Contexts ============')
    console.log(conv.contexts.input);
    console.log(conv.contexts.input.trainjourneystartcntxt?.parameters);
    console.log('========= Parameter Contexts ============')
    console.log(conv.body.queryResult.parameters);
    
})*/



// ================ Rent car intents ==================

app.intent('MyTravelPlanner.RentCarJourney20SecondCheck', conv => {
    console.log('==========MyTravelPlanner.RentCarJourney20SecondCheck=====')
    console.log('========= Input Contexts ============')
    console.log(conv.contexts.input);
    console.log(conv.contexts.input.trainjourneystartcntxt?.parameters);
    console.log('========= Parameter Contexts ============')
    console.log(conv.parameters)
    const trainJourneyStartContext = conv.contexts.input.trainjourneystartcntxt?.parameters;
    let isRentCarIn20Sec = false;
    if(userTrainBookedTimes[conv.id]) {
        const currentTime = new Date();
        const diffInTrainBookAndRentCarInSeconds =  Math.abs(userTrainBookedTimes[conv.id].getTime() - currentTime.getTime())/1000;
        console.log(diffInTrainBookAndRentCarInSeconds)
        if(diffInTrainBookAndRentCarInSeconds<20) {
            isRentCarIn20Sec=true;
        }
    }
    if(isRentCarIn20Sec) {
        conv.add(`Do you want to rent car at ${trainJourneyStartContext['destination.original']}`);
        conv.ask(new Suggestions(yesNoSelections));
    } else {
        conv.followup('RENT_CAR_JOURNEY_START')
        /*conv.add(`Please provide location for you car rental`);
        conv.ask(new Suggestions(locationList));*/
    }
})

app.intent('MyTravelPlanner.RentCarJourney20SecondCheck - yes', conv => {
    conv.followup('RENT_CAR_JOURNEY_START')
})

app.intent('MyTravelPlanner.RentCarJourney20SecondCheck - no', conv => {
    conv.followup('RENT_CAR_JOURNEY_START')
})


app.intent('MyTravelPlanner.RentCarJourneyStart', conv => {
    console.log('==========MyTravelPlanner.RentCarJourneyStart=====')
    /*console.log('========= Input Contexts ============')
    console.log(conv.contexts.input);
    console.log(conv.contexts.input.trainjourneystartcntxt?.parameters);
    console.log('========= Parameter Contexts ============')*/
    const rentCarParams = conv.parameters;
    if(isEmpty(rentCarParams.rentCarLocation)) {
        conv.add(`Please provide location for you car rental`);
        conv.ask(new Suggestions(locationList));
    } else {
        conv.add(`For when do you want to book rent car`);
        conv.ask(new Suggestions(rentCarDateList));
    }
})


app.intent('MyTravelPlanner.RentCar.SelectRentCarDate', conv => {
    console.log('==========MyTravelPlanner.RentCar.SelectRentCarDate=====')
    /*console.log('========= Input Contexts ============')
    console.log(conv.contexts.input);
    console.log(conv.contexts.input.trainjourneystartcntxt?.parameters);
    console.log('========= Parameter Contexts ============')*/
    const rentCarDateParams = conv.parameters;
    if(isEmpty(rentCarDateParams.rentCarDate)) {
        conv.add(`For when do you want to book rent car`);
        conv.ask(new Suggestions(rentCarDateList));
    } else {
        conv.followup('RENT_CAR_SELECT_CAR');
        /*conv.add(`Please select from below available cars.`);
        conv.ask(new Suggestions(availableCarsForRent));*/
    } 
})

app.intent('MyTravelPlanner.RentCar.SelectRentCar', conv => {
    console.log('==========MyTravelPlanner.RentCar.SelectRentCar=====')
    /*console.log('========= Input Contexts ============')
    console.log(conv.contexts.input);
    console.log(conv.contexts.input.rentcarjourneycntxt?.parameters);
    console.log('========= Parameter Contexts ============')
    console.log('========= Parameter Contexts ============')
    console.log(conv.parameters)*/
    const rentCarParams = conv.parameters;
    if(isEmpty(rentCarParams.rentCarName)) {
        conv.add(`Please select from below available cars.`);
        conv.ask(new Suggestions(availableCarsForRent));
    } else {
        const rentCarJourneyConParams = conv.contexts.input.rentcarjourneycntxt?.parameters;
        let rentedCarDate = new Date(rentCarJourneyConParams.rentCarDate)
        rentedCarDate = formatDate(rentedCarDate);
        const rentCarLocation = rentCarJourneyConParams.rentCarLocation.city || rentCarJourneyConParams.rentCarLocation['admin-area']
        conv.close(`${rentCarJourneyConParams.rentCarName} Booked for ${rentCarLocation} for ${rentedCarDate}`);
    }
})

// ================ End of Rent car intents =============

function isEmpty(val) {
    return (val === undefined|| val === null || val.length <= 0);
}

function formatDate(val) {
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    return val.toLocaleDateString('en', {year: 'numeric', month: 'short', day: 'numeric'});
}

app.catch((conv, error) => {
    console.error(error);
    conv.ask('I encountered a glitch. Can you say that again?');
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);