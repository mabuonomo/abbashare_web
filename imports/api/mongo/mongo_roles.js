import { Mongo } from 'meteor/mongo';
// import { Ground } from 'meteor/Ground';

// export const MongoRoles = new Ground.Collection('roles');

// //le operazioni su task sono permesse solo a certe condizioni
Meteor.roles.allow({
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

Meteor.users.allow({
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

// Meteor.methods({
//     addUserToRole: function (userId, role, partition) {
//         check(userId, String);
//         check(role, String);
//         check(partition, String);

//         if (!this.userId || !Roles.userIsInRole(this.userId, 'admin', 'vonvo')) throw new Meteor.Error('unauthorized', "Unauthorized.");
//         if (this.userId === userId) throw new Meteor.Error('unauthorized', "Unauthorized.");

//         Roles.addUsersToRoles(userId, role, partition);
//     }
// });

