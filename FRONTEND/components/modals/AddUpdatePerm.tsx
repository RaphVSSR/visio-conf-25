/*Author : Matthieu BIVILLE*/

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import styles from "./ChangeUserStatus.module.css"
import { useEffect, useState } from "react";

export default function AddUpdatePerm({
    label,
    setLabel,
    uuid,
    setUuid,
    selectedPerm,
    setSelectedPerm,
    openChangeLabel,
    setOpenChangeLabel,
    handleChangeLabel
} : {
    label? : string,
    setLabel : Function,
    uuid : string,
    setUuid : Function,
    selectedPerm : any,
    setSelectedPerm : Function,
    openChangeLabel : boolean,
    setOpenChangeLabel : Function,
    handleChangeLabel : any
}) {
    return(
        <Dialog 
            open={openChangeLabel} 
            onClose={() => {
                setSelectedPerm();
                setUuid("");
                setOpenChangeLabel(false);
            }}
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
                {
                    selectedPerm ? (
                        <TextField 
                            id="name"
                            type="text"
                            name="name"
                            label="Libellé de la permission"
                            value={label}
                            required
                            onChange={(e) => setLabel(e.target.value)}
                            sx={{width: "100%"}}
                        />
                    ) : (
                        <div style={{width: "100%", display: "flex", justifyContent: "space-between"}}>
                            <TextField 
                                id="name"
                                type="text"
                                name="name"
                                label="Libellé de la permission"
                                value={label}
                                required
                                onChange={(e) => setLabel(e.target.value)}
                                sx={{width: "45%"}}
                            />
                            <TextField 
                                id="name"
                                type="text"
                                name="name"
                                label="UUID de la permission"
                                value={uuid}
                                required
                                onChange={(e) => setUuid(e.target.value)}
                                sx={{width: "45%"}}
                            />
                        </div>
                    )
                }
            </DialogContent>
            <DialogActions sx={{display: "flex", justifyContent: "space-between"}}>
                <button
                    onClick={() => {
                        setUuid("");
                        setSelectedPerm();
                        setOpenChangeLabel(false);
                    }}
                    style={{backgroundColor: "#0698D6"}}
                    className={styles.button}
                >Annuler</button>
                <button
                    onClick={handleChangeLabel}
                    style={{backgroundColor: "#E02727"}}
                    className={styles.button}
                >Enregistrer</button>
            </DialogActions>
        </Dialog>
    )
}