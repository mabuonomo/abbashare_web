import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import '../imports/api/mongo/mongo_roles.js';
import { MongoUploads } from '../imports/api/mongo/mongo_upload.js';
import { MongoHash } from '../imports/api/mongo/mongo_hash.js';
import Dropbox from 'dropbox';
import fs from 'fs';
import extract from 'ipa-extract-info';
import shortid from 'shortid';
import { Email } from 'meteor/email';

Meteor.startup(() => {
  //sentry
  RavenLogger.initialize({
    server: Meteor.settings.private.sentry_private
  });

  try {
    var mail_url = 'smtps://' + encodeURIComponent(Meteor.settings.private.email_user) + ':'
      + encodeURIComponent(Meteor.settings.private.email_pass) + '@'
      + encodeURIComponent(Meteor.settings.private.email_smtp) + ':'
      + encodeURIComponent(Meteor.settings.private.email_port);

    //console.log(mail_url);
    process.env.MAIL_URL = mail_url;

    var to = "ma.buonomo@gmail.com";
    var from = "#abbashare <infoabbashare@gmail.com>";
    var subject = "Welcome on #abbashare";
    var text = "Thanks to use #abbashare.<br><br>"
      + "With #abbashare you can install ios ipa via browser, without TestFlight or iTunes"
      + "<br><br>Best regards<br>#abbashare";
    //Email.send({ to: to, from: from, subject: subject, html: text });

  } catch (err) { console.error(err); }



  generatePlist = function (name, version, package, link) {
    var plist = '<?xml version="1.0" encoding="UTF-8"?>' +
      '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">' +
      '<plist version="1.0">' +
      '<dict>' +
      '<key>items</key>' +
      '<array>' +
      '<dict>' +
      '<key>assets</key>' +
      '<array>' +
      '<dict>' +
      '<key>kind</key>' +
      '<string>software-package</string>' +
      '<key>url</key>' +
      '<string>' + link + '</string>' +
      '</dict>' +
      '</array>' +
      '<key>metadata</key>' +
      '<dict>' +
      '<key>bundle-identifier</key>' +
      '<string>' + package + '</string>' +
      '<key>bundle-version</key>' +
      '<string>' + version + '</string>' +
      '<key>kind</key>' +
      '<string>software</string>' +
      '<key>title</key>' +
      '<string>' + name + '</string>' +
      '</dict>' +
      '</dict>' +
      '</array>' +
      '</dict>' +
      '</plist>';

    return plist;
  }

  Meteor.methods({
    'login_dropbox'({ access_token, account_id }) {
      HTTP.call('POST', 'https://api.dropboxapi.com/2/users/get_account', {
        data: { account_id: account_id },
        headers: {
          Authorization: "Bearer " + access_token
        }
      }, (error, result) => {
        if (!error) {
          console.log(result);
          console.log(result.data.email);

          //utente va creto o aggiornato e fatto loggare, poi fare un redirect alla home
          var user = Meteor.users.findOne({ 'profile.user_info.email': result.data.email });

          if (!user) {

            console.log("creazione");

            // var newUserData = {
            //   email: result.data.email,
            //   password: result.data.account_id,
            //   profile: { user_info: result.data, access_token: access_token }
            // };

            var newUserId =
              Meteor.users.insert({
                // email: result.data.email,
                // password: result.data.account_id,
                profile: { user_info: result.data, access_token: access_token }
              });

            Accounts.addEmail(newUserId, result.data.email, true);
            Accounts.setPassword(newUserId, result.data.account_id);

            //permette di non aspettare l'invito della email
            this.unblock();

            var to = result.data.email;
            var from = "#abbashare <infoabbashare@gmail.com>";
            var subject = "Welcome on #abbashare";
            var text = "Thanks to use #abbashare.<br><br>"
              + "With #abbashare you can install ios ipa via browser Safari on iOS, without TestFlight or iTunes"
              + "<br><br>Best regards<br>#abbashare";
            Email.send({ to: to, from: from, subject: subject, html: text });

            // console.log(newUserData);

            // //creo l'utente
            // Accounts.createUser(newUserData, function (error) {
            //   if (error) {
            //     // controller.showAlert('Registrazione fallita. Motivo: ' + error.reason);
            //     console.log(error);

            //   } else {
            //     // controller.showAlert('Registrazione riuscita');

            //     // $scope.login(result.data.email, result.data.account_id);

            //   }
            // });
          } else {

            console.log("aggiornamento");

            //aggiorno l'utente
            Meteor.users.update(user._id, {
              $set: {
                profile: { user_info: result.data, access_token: access_token }
              }
            });

            // $scope.login(result.data.email, result.data.account_id);
          }

          return result;

        } else {
          // alert("Errore");
          return error;
        }
      });
    },
    'upload_dp'({ access_token, file, ownerId, file_original }) {

      var folder = "/" + (new Date()).getTime() + "/";
      var path = folder + file_original;

      var fd = fs.openSync(file.path, 'r');
      extract(fd, Meteor.bindEnvironment(function (err, info, raw) {

        MongoUploads.update(file._id, {
          $set: {
            info: {
              info,
              uploadedAt: Math.floor(Date.now() / 1000),
              ownerId: ownerId,
              file_original: file_original,
              server_path: path,
              uploaded: false,
              view: 0,
              download: 0,
              shortId: shortid.generate()
            }
          }
        });
        // }));

        fs.readFile(file.path, Meteor.bindEnvironment(function read(err, data) {
          if (err) {
            throw err;
          }
          // Invoke the next step here however you like
          // console.log(content);   // Put all of the code here (not the best solution)
          var dbx = new Dropbox({ accessToken: access_token });
          Meteor.bindEnvironment(dbx.filesUpload({ path: path, contents: data })
            .then(Meteor.bindEnvironment(function (response) {

              // console.log(response);

              try {
                // Meteor.bindEnvironment(
                // Fiber(function () {
                // Meteor.bindEnvironment((err, res) => {
                response.folder = folder;

                MongoUploads.update(file._id, {
                  $set: {
                    'info.uploaded': true,
                    'dropbox_upload': response
                    // 'info.dropb_path' : folder
                  }
                });

                // });
              } catch (err) { console.log(err); }

              //elimino il file localmente
              fs.unlink(file.path, function (err) {
                if (err) return console.log(err);
                // console.log('file deleted successfully');
              });

            }))
            .catch(function (error) {
              // console.error(error);
            }));
        }));

      }));
    },
    'updateDownload'({ shortId }) {
      var app = MongoUploads.findOne({ 'info.shortId': shortId });//.fetch()[0];
      // console.log(app);

      //aggiorno le view
      MongoUploads.update(app._id, {
        $set: {
          'info.download': app.info.download + 1
        }
      });
    },
    'deleteApp'({ id }) {
      var app = MongoUploads.findOne({ _id: id });
      var owner = Meteor.users.findOne({ _id: app.info.ownerId });
      var access_token = owner.profile.access_token;

      var path = app.dropbox_upload.folder.slice(0, -1);
      // console.log("path: " + path);
      //elimino la cartella remota
      HTTP.call('POST', 'https://api.dropboxapi.com/2/files/delete_v2', {
        data: { path: path },
        headers: {
          Authorization: "Bearer " + access_token,
          'Content-Type': 'application/json'
        }
      }, (error, result) => {
        if (error) {
          console.log(error);
        }

        //elimino dal db
      });

      MongoUploads.remove({ _id: id });

    },

    'getTemporaryLink'({ shortId }) {
      console.log(shortId);

      var app = MongoUploads.findOne({ 'info.shortId': shortId });//.fetch()[0];
      // console.log(app);

      //aggiorno le view
      MongoUploads.update(app._id, {
        $set: {
          'info.view': app.info.view + 1
        }
      });

      var hour4_in_seconds = 14400;
      var date_now = Math.floor(Date.now() / 1000);

      // console.log(app.info.temporaryLink.time + hour4_in_seconds);
      // console.log(date_now);

      //prendo il link solo se non c'è o se sono passate 4h
      if (app.info.temporaryLink === undefined || app.info.temporaryLink.time + hour4_in_seconds < date_now) {

        console.log("entrato in update " + app.info.ownerId);

        var owner = Meteor.users.findOne({ _id: app.info.ownerId });//.fetch()[0];
        // console.log(owner);
        var access_token = owner.profile.access_token;

        if (app) {
          console.log("aggiornamento");

          HTTP.call('POST', 'https://api.dropboxapi.com/2/files/get_temporary_link', {
            data: { path: app.dropbox_upload.path_lower },
            headers: {
              Authorization: "Bearer " + access_token
            }
          }, (error, result) => {
            if (error) console.log(error);

            if (!error) {
              console.log(result);

              //da spostare lato server
              MongoUploads.update(app._id, {
                $set: {
                  'info.temporaryLink': {
                    result: result,
                    time: Math.floor(Date.now() / 1000) //time in seconds
                  }
                }
              });

              // var app = MongoUploads.findOne({ _id: file._id });

              // console.log(app);

              //creo il plist
              var plist = generatePlist(app.info.info[0].CFBundleName, app.info.info[0].CFBundleShortVersionString, app.info.info[0].CFBundleIdentifier,
                result.data.link);

              // console.log(plist);

              var plist_name = Math.floor(Date.now() / 1000) + "plist.xml"
              Meteor.bindEnvironment(fs.writeFile(plist_name, plist, Meteor.bindEnvironment((err) => {
                if (err) throw err;
                // console.log('Lyric saved!');

                console.log("creo plist locally");

                Meteor.bindEnvironment(fs.readFile(plist_name, "utf8", Meteor.bindEnvironment(function (err, data_buffer) {
                  // console.log(err);
                  // console.log(data_buffer);
                  // console.log(app.dropbox_upload.folder);

                  // console.log(err);
                  console.log("read plist");
                  // console.log(data_buffer);

                  //upload plist
                  // Meteor.bindEnvironment(HTTP.call('POST', 'https://content.dropboxapi.com/2/files/upload', {
                  //   data: data_buffer,
                  //   headers: {
                  //     Authorization: "Bearer " + access_token,
                  //     'Dropbox-API-Arg': JSON.stringify({
                  //       "path": app.dropbox_upload.folder + "plist.xml",//"/Homework/math/Matrices.txt",
                  //       "mode": "overwrite",
                  //       "autorename": true,
                  //       "mute": true
                  //     }),
                  //     "Content-Type": "application/octet-stream",
                  //   },
                  //   transformRequest: []
                  // }, (error, result) => {

                  var dbx = new Dropbox({ accessToken: access_token });
                  Meteor.bindEnvironment(dbx.filesUpload({ path: app.dropbox_upload.folder + "plist.xml", contents: data_buffer, mode: 'overwrite' })
                    .then(Meteor.bindEnvironment(function (response) {

                      // console.log("upload plist");
                      // console.log(response);

                      // try {
                      // if (!error) {
                      // console.log(result);

                      HTTP.call('POST', 'https://api.dropboxapi.com/2/files/get_temporary_link', {
                        data: { path: app.dropbox_upload.folder + "plist.xml" },
                        headers: {
                          Authorization: "Bearer " + access_token
                        }
                      }, (error, result) => {

                        console.log("link plist generating...");

                        if (error) console.log(error);

                        if (!error) {
                          // console.log(result);

                          //da spostare lato server
                          result.itunes_link = "itms-services://?action=download-manifest&amp;url=" + result.data.link;

                          console.log("nuovo link");
                          // console.log(result.itunes_link);

                          MongoUploads.update(app._id, {
                            $set: {
                              'info.temporaryLinkPlist': {
                                result: result,
                                time: Math.floor(Date.now() / 1000) //time in seconds
                              }
                            }
                          });
                        }
                      });

                      fs.unlink(plist_name, function (err) {
                        if (err) return console.log(err);
                        // console.log('file deleted successfully');
                      });

                      // }
                      // else {
                      //   // console.log(error);
                      // }
                    })).catch(function (error) {
                      console.error(error);
                    })

                  );

                })));
              })));
              // return result;

            } else {
              alert("Errore");
            }
          });
        }

        // return 0;
      }
    }
  });

  // RavenLogger.log('This is a test message server');

  // //INSERT roles
  // var veterinario = MongoRole.findOne({ role: 'doctor' });
  // if (!veterinario) {
  //   MongoRole.insert({
  //     role: 'doctor'
  //   });
  // }
  // var veterinario = MongoRole.findOne({ role: 'client' });
  // if (!veterinario) {
  //   MongoRole.insert({
  //     role: 'client'
  //   });
  // }
  // var veterinario = MongoRole.findOne({ role: 'pet' });
  // if (!veterinario) {
  //   MongoRole.insert({
  //     role: 'pet'
  //   });
  // }
  // var veterinario = MongoRole.findOne({ role: 'clinic' });
  // if (!veterinario) {
  //   MongoRole.insert({
  //     role: 'clinic'
  //   });
  // }
  // //fine insert roles

  //add subscribe
  // var sub = MongoSubscribe.findOne({ type: '3_months' });
  // if (!sub) {
  //   MongoSubscribe.insert({
  //     type: '3_months',
  //     price: 50,
  //     seconds: 7776000 * 1000
  //   });
  // }
  // var sub = MongoSubscribe.findOne({ type: '6_months' });
  // if (!sub) {
  //   MongoSubscribe.insert({
  //     type: '6_months',
  //     price: 90,
  //     seconds: 15552000 * 1000
  //   });
  // }
  // var sub = MongoSubscribe.findOne({ type: '12_months' });
  // if (!sub) {
  //   MongoSubscribe.insert({
  //     type: '12_months',
  //     price: 150,
  //     seconds: 31536000 * 1000
  //   });
  // }

  // //add form pet
  // var model = MongoFormPet.findOne({ type: 'dog' });
  // if (!model) {
  //   MongoFormPet.insert({
  //     type: 'dog',
  //     field: {}
  //   });
  // }
  // var model = MongoFormPet.findOne({ type: 'cat' });
  // if (!model) {
  //   MongoFormPet.insert({
  //     type: 'cat',
  //     field: {}
  //   });
  // }

  // //add form visit
  // var model = MongoFormVisit.findOne({ type: 'respiratory_system' });
  // if (!model) {
  //   MongoFormVisit.insert({
  //     type: 'respiratory_system',
  //     field: [
  //       {
  //         name: 'breath_mouth',
  //         type: 'input'
  //       },
  //       {
  //         name: 'breath',
  //         type: 'input'
  //       },
  //       {
  //         name: 'tonsils',
  //         type: 'input'
  //       },
  //       {
  //         name: 'other',
  //         type: 'textarea'
  //       }
  //     ]
  //   });
  // }
  // //   // for each eye dx / sx orbit and bulb, eyelid, third eyelid, conjunctiva, 
  // //   // tear apparatus, sclera, cornea, front chamber, iris, uvea front, ocular mobility, pupillary mobility
  // var model = MongoFormVisit.findOne({ type: 'eyepiece' });
  // if (!model) {
  //   MongoFormVisit.insert({
  //     type: 'eyepiece',
  //     field: [
  //       {
  //         name: 'eyelid',
  //         type: 'input'
  //       },
  //       {
  //         name: 'third_eyelid',
  //         type: 'input'
  //       },
  //       {
  //         name: 'conjunctiva',
  //         type: 'input'
  //       },
  //       {
  //         name: 'cornea',
  //         type: 'input'
  //       },
  //       {
  //         name: 'iris',
  //         type: 'input'
  //       },
  //       {
  //         name: 'ocular_mobility',
  //         type: 'input'
  //       },
  //       {
  //         name: 'pupillary_mobility',
  //         type: 'input'
  //       }
  //     ]
  //   });
  // }
});


