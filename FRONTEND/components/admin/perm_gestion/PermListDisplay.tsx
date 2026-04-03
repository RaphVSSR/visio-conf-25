/*Author : Matthieu BIVILLE*/

import styles from "./PermDisplay.module.css"
import { InputAdornment, TextField, Typography } from "@mui/material";
import { Pencil, Search, Trash2 } from "lucide-react";
import { DataGrid } from "@mui/x-data-grid";
import DeleteRole from "../../modals/DeleteRole";
import CustomSnackBar from "../../SnackBar";
import DuplicateRole from "@/components/modals/DuplicateRole";

export default function PermListDisplay ({
    setAddUpdatePerm,
    regex,
    setRegex,
    rows, 
    columns,
    openAlert,
    setOpenAlert,
    userPerms
} : {
    setAddUpdatePerm : Function,
    regex : string,
    setRegex : Function,
    rows : any, 
    columns : any,
    openAlert : boolean,
    setOpenAlert : any,
    userPerms : string[]
}) {
    return (
        <div className={styles.container}>
            <div style={{display: "flex", justifyContent: "space-between"}}>
                <div style={{display : "flex", alignItems : "center", columnGap: "20px"}}>
                    <img src="./icons/User_Friend.svg" alt="" className={styles.icon}/>
                    <Typography variant="subtitle1" className={styles.title} style={{fontSize: "32px", fontWeight: 700}}>Liste des permissions</Typography>
                </div>
                <button 
                    onClick={() => {
                        if(userPerms.includes("admin_ajouter_permission")) setAddUpdatePerm(true);
                    }}
                    style={{backgroundColor: userPerms.includes("admin_ajouter_permission") ? "#223A6A" : "gray"}}
                    className={styles.addButton}
                >+ Ajouter</button>
            </div>
            <TextField 
                id="regex"
                type="text"
                name="regex"
                placeholder="Rechercher une permission"
                value={regex}
                onChange={(e) => setRegex(e.target.value)}
                className={styles.search}
                sx={{marginTop: "93px"}}
                InputProps={{
                    startAdornment: (
                    <InputAdornment position="start">
                        <Search size={20} color="gray" />
                    </InputAdornment>
                    )
                }}
            />
            <DataGrid 
                rows={rows} 
                columns={columns} 
                rowHeight={75}
                getRowId={(row) => row.id}
                columnHeaderHeight={69}
                className={styles.table}
                autoPageSize
                disableRowSelectionOnClick
                sx={{  
                    height : "70%",
                    '& .MuiDataGrid-columnHeader': {
                        backgroundColor: '#EAEAEA',
                        color: '#223A6A',
                        fontWeight: 'bold',
                        fontSize: '20px',
                        paddingInline: "30px"
                    },
                    '& .MuiDataGrid-columnHeaderTitle': {
                        fontWeight: 'bold',
                    },
                    '& .MuiDataGrid-cell': {
                        display: 'flex',
                        alignItems: 'center',
                        paddingInline: "30px"
                    },
                    '& .MuiDataGrid-row:nth-of-type(even)': {
                        backgroundColor: '#EAEAEA',
                    },
                    '& .MuiDataGrid-footerContainer': {
                        backgroundColor: '#EAEAEA',
                    }
                }}
            />
            <CustomSnackBar
                open={openAlert}
                setOpen={setOpenAlert}
                msg="Rôle supprimé avec succès !"
                severity="success"
            />
        </div>
    )
}