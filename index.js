// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const functions = require('firebase-functions');
const { dialogflow, Suggestions } = require('actions-on-google');


const locationList = ['Delhi','Mumbai', 'Goa', 'Banglore','Lucknow', 'Hyderabad'];
const dateList = ['Today', 'Tomorrow', '3 days after today','Select a Date'];
const bookingTypes = ['Book Train Ticket', 'Rent Car'];
const noTrainAvailableSuggestions = ['Change Date', 'Change Destination','Start Over'];
const travelClasses = ['EC','1AC','2AC','3AC','Change destination','Start Over'];

const app = dialogflow();

app.intent('MyTravelPlanner.Welcome', conv => {

 conv.add('Hi, I am your travel planner.You can ask me to book your train ticket(s) and car rental');
 conv.ask(new Suggestions(bookingTypes));

})

app.intent('MyTravelPlanner.TrainTicketJourneyStart', conv => {

    console.log('========= Output Contexts ============')
    console.log(conv.body.queryResult.outputContexts);
    console.log('========= Parameter Contexts ============')
    console.log(conv.body.queryResult.parameters);
 if (isEmpty(conv.parameters.origin)) {
  conv.add('Whats the origin of train?');
  conv.ask(new Suggestions(locationList));
 } else if (isEmpty(conv.parameters.destination)) {
  conv.add('Whats the destination of train?');
  conv.ask(new Suggestions(locationList));
 } else if (isEmpty(conv.parameters.trainDate)) {
  conv.add('For when do you want to book the train tickets?');
  conv.ask(new Suggestions(dateList));
 } else if(conv.parameters.trainDate==='Tomorrow') {
    conv.add('No trains are available for tomorrow');
    conv.ask(new Suggestions(noTrainAvailableSuggestions));
 }else if(conv.parameters.trainDate==='Select a Date') {
    conv.followup('SELECT_DATE_OF_TRAVEL');
    /*const contextData = {'name':`${conv.body.session}/date-select`,'lifespan': 5/*,'parameters':{
        origin: conv.parameters.origin,
        destination: conv.parameters.destination
    }*//*};
    conv.contexts.set(contextData)
    conv.add('Please enter date of travel in YYYY-MM-DD Format.');*/
 }
 else {
    let travelDate = new Date();
    const trainDate = conv.parameters.trainDate;
    
    if(trainDate==='Tomorrow') {
        travelDate = travelDate.setDate(travelDate.getDate() + 1);
    } else if(trainDate==='3 days after today') {
        travelDate = travelDate.setDate(travelDate.getDate() + 3);
    }
    travelDate = new Date(travelDate);
    //conv.add(`Congratulations, train ticket has been booked from ${conv.parameters.origin} to ${conv.parameters.destination} for ${conv.parameters.trainDate}.`);
    conv.add(`Congratulations, train ticket has been booked from ${conv.parameters.origin} to ${conv.parameters.destination} for ${travelDate}.`);
 }
});

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

app.intent('MyTravelPlanner.TrainTicket.SelectDate', conv => {
    console.log('========= Session name ============')
    console.log(conv.body.session);
    console.log('========= Output Contexts ============')
    console.log(conv.body.queryResult.outputContexts);
    console.log('========= Parameter Contexts ============')
    console.log(conv.body.queryResult.parameters);
    if (isEmpty(conv.parameters.customTravelDate)) {
        console.log('*************** Coming empty custom travel date************')
        conv.add('Please enter date of travel in YYYY-MM-DD Format.');
    } else {
        const selectedDate = new Date(conv.parameters.customTravelDate);
        if(selectedDate.toString()==='Invalid Date') {
            console.log('*************** Coming invalid travel date ************')
            /*conv.contexts.set({'name':`MyTravelPlannerTrainTicketJourneyStart-followup`,'lifespan': 1,'parameters':{
                customTravelDate: ''
            }})*/
            conv.contexts.set('MyTravelPlannerTrainTicketJourneyStart-followup', 1, {
                customTravelDate: ''
            });

            conv.add('Please enter date of travel in YYYY-MM-DD Format.');
        }else {

        }
    }
})

app.intent('MyTravelPlanner.TrainTicket.TravelClass', conv => {
    console.log('========= Output Contexts ============')
    console.log(conv.body.queryResult.outputContexts);
    console.log('========= Parameter Contexts ============')
    console.log(conv.body.queryResult.parameters);
    if (isEmpty(conv.parameters.travelClass)) {
        conv.add('Which class do you want to travel');
        conv.ask(new Suggestions(travelClasses));
    }
})

/*app.intent('MyTravelPlanner.TrainTicketJourney.ChangeDate', conv => {

    if (isEmpty(conv.parameters.trainDate)) {
     conv.add('For when do you want to book the train tickets?');
     conv.ask(new Suggestions(dateList));
    } else if(conv.parameters.trainDate==='Tomorrow') {
       conv.add('No trains are available for tomorrow');
       conv.ask(new Suggestions(noTrainAvailableSuggestions));
    } else if(conv.parameters.trainDate==='Select a Date') {
        
    }
    else {
       let travelDate = new Date();
       const trainDate = conv.parameters.trainDate;
       
       if(trainDate==='Tomorrow') {
           travelDate = travelDate.setDate(travelDate.getDate() + 1);
       } else if(trainDate==='3 days after today') {
           travelDate = travelDate.setDate(travelDate.getDate() + 3);
       }
       travelDate = new Date(travelDate);
       //conv.add(`Congratulations, train ticket has been booked from ${conv.parameters.origin} to ${conv.parameters.destination} for ${conv.parameters.trainDate}.`);
       conv.add(`Congratulations, train ticket has been booked from ${conv.parameters.origin} to ${conv.parameters.destination} for ${travelDate}.`);
    }
   });*/

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);