require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Pool de conexiones
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

// Función para crear las tablas si no existen
async function crearTablas() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conectado a MySQL en Railway');

        // Crear tabla Padre
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Padre (
                DNI_padre VARCHAR(20) PRIMARY KEY,
                Nombre_padre VARCHAR(100) NOT NULL,
                Apellido_padre VARCHAR(100) NOT NULL,
                Ocupacion VARCHAR(100),
                Telefono_padre VARCHAR(20)
            )
        `);

        // Crear tabla Estudiantes
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Estudiantes (
                Codigo_estudiante INT AUTO_INCREMENT PRIMARY KEY,
                Nombre_estudiante VARCHAR(100) NOT NULL,
                Apellido_estudiante VARCHAR(100) NOT NULL,
                Direccion VARCHAR(200),
                Sexo ENUM('M', 'F') NOT NULL,
                Fecha_nacimiento DATE NOT NULL,
                Lugar_nacimiento VARCHAR(100),
                DNI_padre VARCHAR(20),
                FOREIGN KEY (DNI_padre) REFERENCES Padre(DNI_padre)
            )
        `);

        // Crear tabla Grado
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Grado (
                Id_grado INT AUTO_INCREMENT PRIMARY KEY,
                Nivel_grado VARCHAR(50) NOT NULL
            )
        `);

        // Crear tabla Periodo_Academico
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Periodo_Academico (
                Id_periodo INT AUTO_INCREMENT PRIMARY KEY,
                Fecha_inicio DATE NOT NULL,
                Fecha_fin DATE NOT NULL
            )
        `);

        // Crear tabla Matricula
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Matricula (
                Id_Matricula INT AUTO_INCREMENT PRIMARY KEY,
                Estado_matricula ENUM('activo', 'inactivo', 'retirado') NOT NULL,
                Fecha_Matricula DATE NOT NULL,
                DNI_padre VARCHAR(20) NOT NULL,
                Id_grado INT NOT NULL,
                Id_periodo_academico INT NOT NULL,
                FOREIGN KEY (DNI_padre) REFERENCES Padre(DNI_padre),
                FOREIGN KEY (Id_grado) REFERENCES Grado(Id_grado),
                FOREIGN KEY (Id_periodo_academico) REFERENCES Periodo_Academico(Id_periodo)
            )
        `);

        // Crear tabla Pago
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Pago (
                Id_pago INT AUTO_INCREMENT PRIMARY KEY,
                Fecha_pago DATE NOT NULL,
                Monto_pago DECIMAL(10,2) NOT NULL,
                Id_matricula INT NOT NULL,
                FOREIGN KEY (Id_matricula) REFERENCES Matricula(Id_Matricula)
            )
        `);

        // Crear tabla Calificacion
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Calificacion (
                Id_calificacion INT AUTO_INCREMENT PRIMARY KEY,
                NotaPractica DECIMAL(4,2),
                NotaExamen DECIMAL(4,2),
                NotaLaboratorio DECIMAL(4,2),
                Id_matricula INT NOT NULL,
                FOREIGN KEY (Id_matricula) REFERENCES Matricula(Id_Matricula)
            )
        `);

        // Crear tabla Materia
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Materia (
                Codigo_materia INT AUTO_INCREMENT PRIMARY KEY,
                Nombre_materia VARCHAR(100) NOT NULL,
                Id_grado INT NOT NULL,
                FOREIGN KEY (Id_grado) REFERENCES Grado(Id_grado)
            )
        `);

        // Crear tabla Seccion
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Seccion (
                Id_seccion INT AUTO_INCREMENT PRIMARY KEY,
                Cantidad_alumnos INT DEFAULT 0,
                Letra VARCHAR(5) NOT NULL,
                Id_grado INT NOT NULL,
                FOREIGN KEY (Id_grado) REFERENCES Grado(Id_grado)
            )
        `);

        // Crear tabla Carga_Horaria
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Carga_Horaria (
                Id_horario INT AUTO_INCREMENT PRIMARY KEY,
                Hora_inicio TIME NOT NULL,
                Hora_fin TIME NOT NULL,
                Id_seccion INT NOT NULL,
                FOREIGN KEY (Id_seccion) REFERENCES Seccion(Id_seccion)
            )
        `);

        // Crear tabla Profesor
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Profesor (
                Codigo_profesor INT AUTO_INCREMENT PRIMARY KEY,
                Nombre_profesor VARCHAR(100) NOT NULL,
                Apellido_profesor VARCHAR(100) NOT NULL,
                Especialidad VARCHAR(100),
                Id_horario INT,
                FOREIGN KEY (Id_horario) REFERENCES Carga_Horaria(Id_horario)
            )
        `);

        console.log('✅ Todas las tablas creadas o verificadas correctamente');
        connection.release();
    } catch (error) {
        console.error('❌ Error al crear tablas:', error.message);
    }
}

// ============= RUTAS PARA PADRES =============

// Obtener todos los padres
app.get('/api/padres', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Padre');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear padre
app.post('/api/padres', async (req, res) => {
    try {
        const { DNI_padre, Nombre_padre, Apellido_padre, Ocupacion, Telefono_padre } = req.body;
        const [result] = await pool.query(
            'INSERT INTO Padre (DNI_padre, Nombre_padre, Apellido_padre, Ocupacion, Telefono_padre) VALUES (?, ?, ?, ?, ?)',
            [DNI_padre, Nombre_padre, Apellido_padre, Ocupacion, Telefono_padre]
        );
        res.status(201).json({ message: 'Padre creado exitosamente', DNI_padre });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============= RUTAS PARA ESTUDIANTES =============

// Obtener todos los estudiantes
app.get('/api/estudiantes', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT e.*, p.Nombre_padre, p.Apellido_padre 
            FROM Estudiantes e 
            LEFT JOIN Padre p ON e.DNI_padre = p.DNI_padre
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear estudiante
app.post('/api/estudiantes', async (req, res) => {
    try {
        const { Nombre_estudiante, Apellido_estudiante, Direccion, Sexo, Fecha_nacimiento, Lugar_nacimiento, DNI_padre } = req.body;
        const [result] = await pool.query(
            'INSERT INTO Estudiantes (Nombre_estudiante, Apellido_estudiante, Direccion, Sexo, Fecha_nacimiento, Lugar_nacimiento, DNI_padre) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [Nombre_estudiante, Apellido_estudiante, Direccion, Sexo, Fecha_nacimiento, Lugar_nacimiento, DNI_padre]
        );
        res.status(201).json({ message: 'Estudiante creado exitosamente', id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar estudiante
app.delete('/api/estudiantes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Estudiantes WHERE Codigo_estudiante = ?', [id]);
        res.json({ message: 'Estudiante eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============= RUTAS PARA GRADOS =============

app.get('/api/grados', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Grado');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/grados', async (req, res) => {
    try {
        const { Nivel_grado } = req.body;
        const [result] = await pool.query('INSERT INTO Grado (Nivel_grado) VALUES (?)', [Nivel_grado]);
        res.status(201).json({ message: 'Grado creado exitosamente', id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============= RUTAS PARA PERIODOS ACADÉMICOS =============

app.get('/api/periodos', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Periodo_Academico');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/periodos', async (req, res) => {
    try {
        const { Fecha_inicio, Fecha_fin } = req.body;
        const [result] = await pool.query(
            'INSERT INTO Periodo_Academico (Fecha_inicio, Fecha_fin) VALUES (?, ?)',
            [Fecha_inicio, Fecha_fin]
        );
        res.status(201).json({ message: 'Periodo creado exitosamente', id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============= RUTAS PARA MATRÍCULAS =============

app.get('/api/matriculas', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT m.*, p.Nombre_padre, p.Apellido_padre, g.Nivel_grado,
                   pa.Fecha_inicio, pa.Fecha_fin
            FROM Matricula m
            JOIN Padre p ON m.DNI_padre = p.DNI_padre
            JOIN Grado g ON m.Id_grado = g.Id_grado
            JOIN Periodo_Academico pa ON m.Id_periodo_academico = pa.Id_periodo
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/matriculas', async (req, res) => {
    try {
        const { Estado_matricula, Fecha_Matricula, DNI_padre, Id_grado, Id_periodo_academico } = req.body;
        const [result] = await pool.query(
            'INSERT INTO Matricula (Estado_matricula, Fecha_Matricula, DNI_padre, Id_grado, Id_periodo_academico) VALUES (?, ?, ?, ?, ?)',
            [Estado_matricula, Fecha_Matricula, DNI_padre, Id_grado, Id_periodo_academico]
        );
        res.status(201).json({ message: 'Matrícula creada exitosamente', id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============= RUTAS PARA PAGOS =============

app.get('/api/pagos', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.*, m.Estado_matricula, m.Fecha_Matricula
            FROM Pago p
            JOIN Matricula m ON p.Id_matricula = m.Id_Matricula
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/pagos', async (req, res) => {
    try {
        const { Fecha_pago, Monto_pago, Id_matricula } = req.body;
        const [result] = await pool.query(
            'INSERT INTO Pago (Fecha_pago, Monto_pago, Id_matricula) VALUES (?, ?, ?)',
            [Fecha_pago, Monto_pago, Id_matricula]
        );
        res.status(201).json({ message: 'Pago registrado exitosamente', id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============= RUTAS PARA CALIFICACIONES =============

app.get('/api/calificaciones', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.*, m.Id_Matricula
            FROM Calificacion c
            JOIN Matricula m ON c.Id_matricula = m.Id_Matricula
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/calificaciones', async (req, res) => {
    try {
        const { NotaPractica, NotaExamen, NotaLaboratorio, Id_matricula } = req.body;
        const [result] = await pool.query(
            'INSERT INTO Calificacion (NotaPractica, NotaExamen, NotaLaboratorio, Id_matricula) VALUES (?, ?, ?, ?)',
            [NotaPractica, NotaExamen, NotaLaboratorio, Id_matricula]
        );
        res.status(201).json({ message: 'Calificación registrada exitosamente', id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============= RUTAS PARA MATERIAS =============

app.get('/api/materias', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT m.*, g.Nivel_grado
            FROM Materia m
            JOIN Grado g ON m.Id_grado = g.Id_grado
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/materias', async (req, res) => {
    try {
        const { Nombre_materia, Id_grado } = req.body;
        const [result] = await pool.query(
            'INSERT INTO Materia (Nombre_materia, Id_grado) VALUES (?, ?)',
            [Nombre_materia, Id_grado]
        );
        res.status(201).json({ message: 'Materia creada exitosamente', id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============= RUTAS PARA PROFESORES =============

app.get('/api/profesores', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Profesor');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/profesores', async (req, res) => {
    try {
        const { Nombre_profesor, Apellido_profesor, Especialidad, Id_horario } = req.body;
        const [result] = await pool.query(
            'INSERT INTO Profesor (Nombre_profesor, Apellido_profesor, Especialidad, Id_horario) VALUES (?, ?, ?, ?)',
            [Nombre_profesor, Apellido_profesor, Especialidad, Id_horario]
        );
        res.status(201).json({ message: 'Profesor creado exitosamente', id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============= RUTA DE INICIO =============

app.get('/', (req, res) => {
    res.json({ 
        message: '🎓 API del Sistema de Gestión de Colegio',
        estado: 'Funcionando correctamente',
        endpoints: {
            padres: '/api/padres',
            estudiantes: '/api/estudiantes',
            grados: '/api/grados',
            periodos: '/api/periodos',
            matriculas: '/api/matriculas',
            pagos: '/api/pagos',
            calificaciones: '/api/calificaciones',
            materias: '/api/materias',
            profesores: '/api/profesores'
        }
    });
});

// Iniciar el servidor y crear tablas
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    // Crear tablas después de que el servidor inicie
    crearTablas();
});