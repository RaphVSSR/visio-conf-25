/*Author : Matthieu BIVILLE*/

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import styles from "./ChangeUserStatus.module.css"

export default function ChangeUserStatus({
    userName,
    openChangeStatus,
    setOpenChangeStatus,
    handleChangeStatus,
    action
} : {
    userName? : string,
    openChangeStatus : boolean,
    setOpenChangeStatus : Function,
    handleChangeStatus : any,
    action : string
}) {
    return(
        <Dialog 
            open={openChangeStatus} 
            onClose={() => {setOpenChangeStatus(false)}}
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
                <p className={styles.text}>
                    Souhaitez-vous vraiment 
                    {action === "activate" ? " activer " : (action === "deactivate" ? " désactiver " : " bannir ")} 
                    l'utilisateur' "{userName}" ?
                </p>
            </DialogContent>
            <DialogActions sx={{display: "flex", justifyContent: "space-between"}}>
                <button
                    onClick={() => {setOpenChangeStatus(false)}}
                    style={{backgroundColor: "#0698D6"}}
                    className={styles.button}
                >Annuler</button>
                <button
                    onClick={handleChangeStatus}
                    style={{backgroundColor: "#E02727"}}
                    className={styles.button}
                >{action === "activate" ? " Activer " : (action === "deactivate" ? " Désactiver " : " Bannir ")}</button>
            </DialogActions>
        </Dialog>
    )
}