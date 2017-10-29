import { Mongo } from 'meteor/mongo';
// import { Ground } from 'meteor/Ground';

export const MongoHash = new Ground.Collection('hash');

// //le operazioni su task sono permesse solo a certe condizioni
MongoHash.allow({
    insert(userId, party) {
        return true;//userId && party.owner === userId;
    },
    update(userId, party, fields, modifier) {
        return true;//userId && party.owner === userId;
    },
    remove(userId, party) {
        return true;//userId && party.owner === userId;
    }
});

