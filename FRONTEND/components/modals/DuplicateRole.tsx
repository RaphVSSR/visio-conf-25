/*Author : Matthieu BIVILLE*/

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import styles from "./DuplicateRole.module.css"

export default function DuplicateRole({
    roleName,
    openDuplicateRole,
    setOpenDuplicateRole,
    handleDuplicateRole
} : {
    roleName? : string,
    openDuplicateRole : boolean,
    setOpenDuplicateRole : Function,
    handleDuplicateRole : any
}) {
    return(
        <Dialog 
            open={openDuplicateRole} 
            onClose={() => {setOpenDuplicateRole(false)}}
            PaperProps={{
                sx: {
                    width: "635px", 
                    height: "333px", 
                    maxWidth: "none",
                    borderRadius: "10px",
                    background: "#FFF",
                    paddingInline: "45px",
                    paddingBottom: "50px",
                    paddingTop: "50px"
                }
            }}
        >
            <DialogContent style={{textAlign: "center"}}>
                <p className={styles.text}>Souhaitez-vous vraiment dupliquer le rôle "{roleName}" ?</p>
            </DialogContent>
            <DialogActions sx={{display: "flex", justifyContent: "space-between"}}>
                <button 
                    onClick={() => {setOpenDuplicateRole(false)}}
                    style={{backgroundColor: "#0698D6"}}
                    className={styles.button}
                >Annuler</button>
                <button
                    onClick={handleDuplicateRole}
                    style={{backgroundColor: "#E02727"}}
                    className={styles.button}
                >Dupliquer le rôle</button>
            </DialogActions>
        </Dialog>
    )
}