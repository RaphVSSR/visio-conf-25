/*Author : Matthieu BIVILLE*/

import styles from "./UserDisplay.module.css"
import { InputAdornment, TextField, Typography } from "@mui/material";
import { Pencil, Search, Trash2 } from "lucide-react";
import { DataGrid } from "@mui/x-data-grid";
import CustomSnackBar from "../../SnackBar";
import ChangeUserStatus from "../../modals/ChangeUserStatus";

export default function UserListDisplay ({
    regex,
    setRegex,
    rows, 
    columns,
    openChangeStatus,
    setOpenChangeStatus,
    selectedUser,
    handleChangeStatus,
    openAlert,
    setOpenAlert,
    action
} : {
    regex : string,
    setRegex : Function,
    rows : any, 
    columns : any,
    openChangeStatus : boolean,
    setOpenChangeStatus : Function,
    selectedUser : any,
    handleChangeStatus : any,
    openAlert : boolean,
    setOpenAlert : any,
    action : string
}) {
    return (
        <div className={styles.container}>
            <div style={{display: "flex", justifyContent: "left"}}>
                <div style={{display : "flex", alignItems : "center", columnGap: "20px"}}>
                    <img src="./icons/User_Friend.svg" alt="" className={styles.icon}/>
                    <Typography variant="subtitle1" className={styles.title} style={{fontSize: "32px", fontWeight: 700}}>Liste des utilisateurs</Typography>
                </div>
            </div>
            <TextField 
                id="regex"
                type="text"
                name="regex"
                placeholder="Rechercher un utilisateur"
                value={regex}
                onChange={(e) => setRegex(e.target.value)}
                className={styles.search}
                sx={{marginTop: "40px"}}
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
                rowHeight={69}
                getRowId={(row) => row.id}
                columnHeaderHeight={69}
                className={styles.table}
                autoPageSize
                disableRowSelectionOnClick
                sx={{  
                    height : "80%",
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
            <ChangeUserStatus
                userName={selectedUser?.firstname + " " + selectedUser?.lastname}
                openChangeStatus={openChangeStatus}
                setOpenChangeStatus={setOpenChangeStatus}
                handleChangeStatus={handleChangeStatus}
                action={action}
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