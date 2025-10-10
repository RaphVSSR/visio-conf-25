/* Authors: Matthieu BIVILLE */

import Perm from "../models/permission.js"

class PermsService{
    controleur;
    verbose=false;
    listeDesMessagesEmis=[
        "perms_list_response",
        "update_perm_response",
        "add_perm_response"
    ];
    listeDesMessagesRecus=[
        "perms_list_request",
        "update_perm_request",
        "add_perm_request"
    ];
    
    constructor(c,nom){
        this.controleur=c;
        this.nomDInstance=nom;
        if(this.controleur.verboseall || this.verbose) console.log("INFO ("+this.nomDInstance+"):  s'enregistre aupres du controleur");
        this.controleur.inscription(this,this.listeDesMessagesEmis, this.listeDesMessagesRecus);
    }
    
    async traitementMessage(mesg){
        if(this.controleur.verboseall || this.verbose){
             console.log("INFO ("+this.nomDInstance+"): reçoit le message suivant à traiter");
             console.log(mesg);
        }
    
        if(typeof mesg.perms_list_request != "undefined"){
            var perms = await Perm.find().sort({permission_uuid : 1});
            this.controleur.envoie(this, {
                "perms_list_response" : perms,
                id : [mesg.id]
            });
        }

        if(typeof mesg.update_perm_request != "undefined"){
            await Perm.updateOne(
                {_id : mesg.update_perm_request.perm_id},
                {permission_label : mesg.update_perm_request.newLabel},
            );
            this.controleur.envoie(this, {
                "update_perm_response" : {state : true},
                id : [mesg.id]
            });
        }

        if(typeof mesg.add_perm_request != "undefined"){
            var perm = await Perm.findOne({ permission_uuid: mesg.add_perm_request.newUuid });
            if(perm == null) {
                var newPerm = new Perm({
                    permission_uuid: mesg.add_perm_request.newUuid.toLowerCase(),
                    permission_label: mesg.add_perm_request.newLabel,
                })
                var p = await newPerm.save();
                if(p != null){
                    this.controleur.envoie(this, {
                        "add_perm_response" : {message : "done"},
                        id : [mesg.id]
                    });	
                }			 
            }
            else{
                this.controleur.envoie(this, {
                    "add_perm_response" : {message : "already exists"},
                    id : [mesg.id]
                });
            }
        }
    }
}
export default PermsService
