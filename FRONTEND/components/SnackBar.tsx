import React from "react";
import { Snackbar, Alert } from "@mui/material";

interface CustomSnackBarProps {
  msg: string; // Message à afficher
  severity: "success" | "error" | "warning" | "info"; // Type d'alerte
  open: boolean; // Contrôle si le snackbar est visible
  setOpen: React.Dispatch<React.SetStateAction<boolean>>; // Fonction pour modifier l'état `open`
}

const CustomSnackBar: React.FC<CustomSnackBarProps> = ({ msg, severity, open, setOpen }) => {
  // Fonction appelée pour fermer le snackbar
  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") {
      return; // Ne pas fermer si l'utilisateur clique à côté
    }
    setOpen(false); // Fermer le snackbar
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000} // Durée en millisecondes avant disparition
      onClose={handleClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }} // Position du snackbar
    >
      <Alert onClose={handleClose} severity={severity} sx={{ width: "100%" }}>
        {msg}
      </Alert>
    </Snackbar>
  );
};

export default CustomSnackBar;