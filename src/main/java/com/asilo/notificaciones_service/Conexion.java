package com.asilo.notificaciones_service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class Conexion {
    
    // Cambia 'sa' y 'TuContraseña' por las credenciales de tu SQL Server
    private static final String USUARIO = "sa"; 
private static final String CLAVE = "Admin1234*"; // Coloca la contraseña exactas que le asignaste en el Paso 2
private static final String URL = "jdbc:sqlserver://localhost:1433;databaseName=AsiloCabezaAlgodon;encrypt=false;trustServerCertificate=true;";
    
    public static Connection getConexion() {
        Connection con = null;
        try {
            Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
            con = DriverManager.getConnection(URL, USUARIO, CLAVE);
            System.out.println("¡Conexión exitosa a SQL Server!");
        } catch (ClassNotFoundException e) {
            System.out.println("Error: Driver no encontrado - " + e.getMessage());
        } catch (SQLException e) {
            System.out.println("Error de conexión SQL: " + e.getMessage());
        }
        return con;
    }

    public static void main(String[] args) {
        System.out.println("Probando conexión a SQL Server...");
        Connection cn = Conexion.getConexion();
        
        if (cn != null) {
            System.out.println(">>> La base de datos está enlazada correctamente <<<");
        } else {
            System.out.println(">>> No se pudo establecer la conexión <<<");
        }
    }
}