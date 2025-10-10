/*Author : Matthieu BIVILLE*/

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import styles from "./DeleteRole.module.css"

export default function DeleteRole({
    roleName,
    openDeleteRole,
    setOpenDeleteRole,
    handleDeleteRole
} : {
    roleName? : string,
    openDeleteRole : boolean,
    setOpenDeleteRole : Function,
    handleDeleteRole : any
}) {
    return(
        <Dialog 
            open={openDeleteRole} 
            onClose={() => {setOpenDeleteRole(false)}}
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
                <p className={styles.text}>Souhaitez-vous vraiment supprimer le rôle "{roleName}" ?</p>
            </DialogContent>
            <DialogActions sx={{display: "flex", justifyContent: "space-between"}}>
                <button 
                    onClick={() => {setOpenDeleteRole(false)}}
                    style={{backgroundColor: "#0698D6"}}
                    className={styles.button}
                >Annuler</button>
                <button
                    onClick={handleDeleteRole}
                    style={{backgroundColor: "#E02727"}}
                    className={styles.button}
                >Supprimer le rôle</button>
            </DialogActions>
        </Dialog>
    )
}