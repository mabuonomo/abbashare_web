import { Accounts } from 'meteor/accounts-base';
import firebase from 'firebase';

Accounts.ui.config({
  passwordSignupFields: 'USERNAME_ONLY',
});

//sentry
RavenLogger.initialize({
  client: Meteor.settings.public.sentry_public
});

var config = {
  apiKey: "AIzaSyDjUtoB9KjzpROUwxJ9XTfbV_6NRq81cn8",
  authDomain: "abbashare-97d86.firebaseapp.com",
  databaseURL: "https://abbashare-97d86.firebaseio.com",
  projectId: "abbashare-97d86",
  storageBucket: "abbashare-97d86.appspot.com",
  messagingSenderId: "664944047561"
};
firebase.initializeApp(config);

// RavenLogger.log('This is a test message client');