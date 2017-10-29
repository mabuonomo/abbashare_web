import { Mongo } from 'meteor/mongo';
import { FilesCollection } from 'meteor/ostrio:files';

// import { Ground } from 'meteor/Ground';

// const MongoUploads = new Ground.Collection('mongo_uploads');

// https://github.com/VeliovGroup/Meteor-Files/issues/260
// https://github.com/VeliovGroup/Meteor-Files

//vieaw at localhost:3000/cdn/storage/assets/app/uploads/mongo_uploads/vmNe8o9TJA8LFHkyZ
export const MongoUploads = new FilesCollection({
    collectionName: 'mongo_uploads',
    allowClientCode: false, // Disallow remove files from Client
    onBeforeUpload(file) {
        // Allow upload files under 10MB, and only in png/jpg/jpeg formats
        // if (file.size <= 10485760 && /png|jpg|jpeg/i.test(file.extension)) {
        return true;
        // } else {
        //     return 'Please upload image, with size equal or less than 10MB';
        // }
    }
});

// MongoUploads.allow({
//     insert(userId, party) {
//         return true;//userId && party.owner === userId;
//     },
//     update(userId, party, fields, modifier) {
//         return true;//userId && party.owner === userId;
//     },
//     remove(userId, party) {
//         return true;//userId && party.owner === userId;
//     }
// });

//le operazioni su task sono permesse solo a certe condizioni
// MongoUploads.allow({
//     insert(userId, party) {
//         return true;//userId && party.owner === userId;
//     },
//     update(userId, party, fields, modifier) {
//         return true;//userId && party.owner === userId;
//     },
//     remove(userId, party) {
//         return true;//userId && party.owner === userId;
//     }
// });

