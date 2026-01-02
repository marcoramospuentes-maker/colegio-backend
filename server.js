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

        // ========== TABLAS DE CATÁLOGO ==========

        // Tabla Lugar
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Lugar (
                Id_lugar INT AUTO_INCREMENT PRIMARY KEY,
                lugar VARCHAR(100) NOT NULL
            )
        `);

        // Tabla Direccion
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Direccion (
                Id_Direccion INT AUTO_INCREMENT PRIMARY KEY,
                Manzana VARCHAR(20),
                Lote VARCHAR(20),
                Distrito VARCHAR(100),
                Provincia VARCHAR(100),
                Calle VARCHAR(200),
                Referencia VARCHAR(200)
            )
        `);

        // Tabla Ocupacion
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Ocupacion (
                Id_Ocupacion INT AUTO_INCREMENT PRIMARY KEY,
                Ocupacion VARCHAR(100) NOT NULL
            )
        `);

        // Tabla Grado
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Grado (
                Id_grado INT AUTO_INCREMENT PRIMARY KEY,
                Nivel_grado INT NOT NULL
            )
        `);

        // Tabla Especialidad
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Especialidad (
                Id_especialidad INT AUTO_INCREMENT PRIMARY KEY,
                Nombre_especialidad VARCHAR(100) NOT NULL
            )
        `);

        // Tabla Periodo_Academico
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Periodo_Academico (
                Id_periodo INT AUTO_INCREMENT PRIMARY KEY,
                Fecha_inicio DATE NOT NULL,
                Fecha_fin DATE NOT NULL
            )
        `);

        // Tabla Seccion
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Seccion (
                Id_seccion INT AUTO_INCREMENT PRIMARY KEY,
                Cantidad_alumnos INT,
                Letra VARCHAR(5) NOT NULL
            )
        `);

        // Tabla Carga_Horaria
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Carga_Horaria (
                Id_horario INT AUTO_INCREMENT PRIMARY KEY,
                Hora_inicio TIME NOT NULL,
                Hora_fin TIME NOT NULL
            )
        `);

        // ========== TABLAS PRINCIPALES ==========

        // Tabla Estudiantes
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Estudiantes (
                Codigo_estudiante INT AUTO_INCREMENT PRIMARY KEY,
                Nombre_estudiante VARCHAR(100) NOT NULL,
                ApellidoPaterno_estudiante VARCHAR(100) NOT NULL,
                ApellidoMaterno_estudiante VARCHAR(100) NOT NULL,
                Sexo VARCHAR(10) NOT NULL,
                Fecha_nacimiento DATE NOT NULL
            )
        `);

        // Tabla Padre
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Padre (
                DNI_padre INT PRIMARY KEY,
                Nombre_padre VARCHAR(100) NOT NULL,
                ApellidoPaterno_padre VARCHAR(100) NOT NULL,
                ApellidoMaterno_padre VARCHAR(100) NOT NULL,
                Telefono_padre INT
            )
        `);

        // Tabla Profesor
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Profesor (
                Codigo_profesor INT AUTO_INCREMENT PRIMARY KEY,
                Nombre_profesor VARCHAR(100) NOT NULL,
                ApellidoPaterno_profesor VARCHAR(100) NOT NULL,
                ApellidoMaterno_profesor VARCHAR(100) NOT NULL
            )
        `);

        // Tabla Materia
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Materia (
                Codigo_materia INT AUTO_INCREMENT PRIMARY KEY,
                Nombre_materia VARCHAR(100) NOT NULL,
                Id_grado INT,
                FOREIGN KEY (Id_grado) REFERENCES Grado(Id_grado)
            )
        `);

        // Tabla Matricula
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Matricula (
                Id_Matricula INT AUTO_INCREMENT PRIMARY KEY,
                Estado_matricula VARCHAR(20) NOT NULL,
                Fecha_Matricula DATE NOT NULL
            )
        `);

        // Tabla Pago
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Pago (
                Id_pago INT AUTO_INCREMENT PRIMARY KEY,
                Fecha_pago DATE NOT NULL,
                Monto_pago INT NOT NULL,
                Id_matricula INT,
                FOREIGN KEY (Id_matricula) REFERENCES Matricula(Id_Matricula)
            )
        `);

        // Tabla Calificacion
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Calificacion (
                Id_calificacion INT AUTO_INCREMENT PRIMARY KEY,
                NotaPractica INT,
                NotaExamen INT,
                NotaLaboratorio INT
            )
        `);

        // ========== TABLAS DE RELACIÓN ==========

        // Tabla Lugar_Nacimiento_Estudiante
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Lugar_Nacimiento_Estudiante (
                Id_lugar INT,
                Codigo_estudiante INT,
                PRIMARY KEY (Id_lugar, Codigo_estudiante),
                FOREIGN KEY (Id_lugar) REFERENCES Lugar(Id_lugar),
                FOREIGN KEY (Codigo_estudiante) REFERENCES Estudiantes(Codigo_estudiante)
            )
        `);

        // Tabla Direccion_Estudiante (relacionada con Padre)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Direccion_Estudiante (
                DNI_padre INT,
                Id_Direccion INT,
                PRIMARY KEY (DNI_padre, Id_Direccion),
                FOREIGN KEY (DNI_padre) REFERENCES Padre(DNI_padre),
                FOREIGN KEY (Id_Direccion) REFERENCES Direccion(Id_Direccion)
            )
        `);

        // Tabla Detalle_Ocupacion
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Detalle_Ocupacion (
                DNI_padre INT,
                Id_Ocupacion INT,
                PRIMARY KEY (DNI_padre, Id_Ocupacion),
                FOREIGN KEY (DNI_padre) REFERENCES Padre(DNI_padre),
                FOREIGN KEY (Id_Ocupacion) REFERENCES Ocupacion(Id_Ocupacion)
            )
        `);

        // Tabla Detalle_Matricula
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Detalle_Matricula (
                DNI_Padre INT,
                Id_grado INT,
                Id_pago INT,
                Id_Matricula INT,
                PRIMARY KEY (DNI_Padre, Id_grado, Id_pago, Id_Matricula),
                FOREIGN KEY (DNI_Padre) REFERENCES Padre(DNI_padre),
                FOREIGN KEY (Id_grado) REFERENCES Grado(Id_grado),
                FOREIGN KEY (Id_pago) REFERENCES Pago(Id_pago),
                FOREIGN KEY (Id_Matricula) REFERENCES Matricula(Id_Matricula)
            )
        `);

        // Tabla Detalle_Calificacion
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Detalle_Calificacion (
                Codigo_materia INT,
                Id_periodo INT,
                Id_calificacion INT,
                PRIMARY KEY (Codigo_materia, Id_periodo, Id_calificacion),
                FOREIGN KEY (Codigo_materia) REFERENCES Materia(Codigo_materia),
                FOREIGN KEY (Id_periodo) REFERENCES Periodo_Academico(Id_periodo),
                FOREIGN KEY (Id_calificacion) REFERENCES Calificacion(Id_calificacion)
            )
        `);

        // Tabla Detalle_Seccion
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Detalle_Seccion (
                Id_seccion INT,
                Id_grado INT,
                PRIMARY KEY (Id_seccion, Id_grado),
                FOREIGN KEY (Id_seccion) REFERENCES Seccion(Id_seccion),
                FOREIGN KEY (Id_grado) REFERENCES Grado(Id_grado)
            )
        `);

        // Tabla Detalle_Horario_Seccion
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Detalle_Horario_Seccion (
                Id_horario INT,
                Id_seccion INT,
                PRIMARY KEY (Id_horario, Id_seccion),
                FOREIGN KEY (Id_horario) REFERENCES Carga_Horaria(Id_horario),
                FOREIGN KEY (Id_seccion) REFERENCES Seccion(Id_seccion)
            )
        `);

        // Tabla Profesor_Especialidad
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Profesor_Especialidad (
                Codigo_profesor INT,
                Id_especialidad INT,
                PRIMARY KEY (Codigo_profesor, Id_especialidad),
                FOREIGN KEY (Codigo_profesor) REFERENCES Profesor(Codigo_profesor),
                FOREIGN KEY (Id_especialidad) REFERENCES Especialidad(Id_especialidad)
            )
        `);

        // Tabla Profesor_Horario
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Profesor_Horario (
                Codigo_profesor INT,
                Id_horario INT,
                PRIMARY KEY (Codigo_profesor, Id_horario),
                FOREIGN KEY (Codigo_profesor) REFERENCES Profesor(Codigo_profesor),
                FOREIGN KEY (Id_horario) REFERENCES Carga_Horaria(Id_horario)
            )
        `);

        connection.release();
        console.log('✅ Todas las tablas verificadas/creadas (22 tablas normalizadas)');
    } catch (error) {
        console.error('❌ Error al crear tablas:', error.message);
    }
}

// ==================== ENDPOINTS ====================

// Ruta principal
app.get('/', (req, res) => {
    res.json({
        message: '🎓 API del Sistema de Gestión Escolar',
        estado: 'Funcionando correctamente',
        version: '2.0 - Normalizado',
        endpoints: {
            estudiantes: '/api/estudiantes',
            padres: '/api/padres',
            profesores: '/api/profesores',
            grados: '/api/grados',
            secciones: '/api/secciones',
            materias: '/api/materias',
            matriculas: '/api/matriculas',
            pagos: '/api/pagos',
            calificaciones: '/api/calificaciones',
            periodos: '/api/periodos',
            lugares: '/api/lugares',
            direcciones: '/api/direcciones',
            ocupaciones: '/api/ocupaciones',
            especialidades: '/api/especialidades',
            horarios: '/api/horarios'
        }
    });
});

// ========== RESET TABLAS (TEMPORAL) ==========
app.get('/api/reset-tablas', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        // Desactivar verificación de foreign keys
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        
        // Eliminar tablas existentes
        const tablasEliminar = [
            'Detalle_Calificacion', 'Detalle_Matricula', 'Detalle_Ocupacion',
            'Direccion_Estudiante', 'Lugar_Nacimiento_Estudiante', 'Profesor_Especialidad',
            'Profesor_Materia', 'Detalle_Seccion', 'Detalle_Carga_Horaria',
            'Calificacion', 'Pago', 'Matricula', 'Materia', 'Profesor', 'Padre', 'Estudiantes',
            'Carga_Horaria', 'Seccion', 'Periodo_Academico', 'Especialidad', 'Grado',
            'Ocupacion', 'Direccion', 'Lugar'
        ];
        
        for (const tabla of tablasEliminar) {
            try {
                await connection.query(`DROP TABLE IF EXISTS ${tabla}`);
            } catch (e) {}
        }
        
        // Reactivar verificación de foreign keys
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        
        connection.release();
        
        // Recrear tablas
        await crearTablas();
        
        res.json({ message: 'Tablas recreadas correctamente con el nuevo esquema normalizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== ESTUDIANTES ==========
app.get('/api/estudiantes', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Estudiantes');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/estudiantes/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Estudiantes WHERE Codigo_estudiante = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Estudiante no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/estudiantes', async (req, res) => {
    try {
        const { Nombre_estudiante, ApellidoPaterno_estudiante, ApellidoMaterno_estudiante, Sexo, Fecha_nacimiento } = req.body;
        const [result] = await pool.query(
            'INSERT INTO Estudiantes (Nombre_estudiante, ApellidoPaterno_estudiante, ApellidoMaterno_estudiante, Sexo, Fecha_nacimiento) VALUES (?, ?, ?, ?, ?)',
            [Nombre_estudiante, ApellidoPaterno_estudiante, ApellidoMaterno_estudiante, Sexo, Fecha_nacimiento]
        );
        res.status(201).json({ id: result.insertId, message: 'Estudiante creado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/estudiantes/:id', async (req, res) => {
    try {
        const { Nombre_estudiante, ApellidoPaterno_estudiante, ApellidoMaterno_estudiante, Sexo, Fecha_nacimiento } = req.body;
        await pool.query(
            'UPDATE Estudiantes SET Nombre_estudiante=?, ApellidoPaterno_estudiante=?, ApellidoMaterno_estudiante=?, Sexo=?, Fecha_nacimiento=? WHERE Codigo_estudiante=?',
            [Nombre_estudiante, ApellidoPaterno_estudiante, ApellidoMaterno_estudiante, Sexo, Fecha_nacimiento, req.params.id]
        );
        res.json({ message: 'Estudiante actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/estudiantes/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM Estudiantes WHERE Codigo_estudiante = ?', [req.params.id]);
        res.json({ message: 'Estudiante eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== PADRES ==========
app.get('/api/padres', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Padre');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/padres/:dni', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Padre WHERE DNI_padre = ?', [req.params.dni]);
        if (rows.length === 0) return res.status(404).json({ error: 'Padre no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/padres', async (req, res) => {
    try {
        const { DNI_padre, Nombre_padre, ApellidoPaterno_padre, ApellidoMaterno_padre, Telefono_padre } = req.body;
        await pool.query(
            'INSERT INTO Padre (DNI_padre, Nombre_padre, ApellidoPaterno_padre, ApellidoMaterno_padre, Telefono_padre) VALUES (?, ?, ?, ?, ?)',
            [DNI_padre, Nombre_padre, ApellidoPaterno_padre, ApellidoMaterno_padre, Telefono_padre]
        );
        res.status(201).json({ message: 'Padre registrado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/padres/:dni', async (req, res) => {
    try {
        const { Nombre_padre, ApellidoPaterno_padre, ApellidoMaterno_padre, Telefono_padre } = req.body;
        await pool.query(
            'UPDATE Padre SET Nombre_padre=?, ApellidoPaterno_padre=?, ApellidoMaterno_padre=?, Telefono_padre=? WHERE DNI_padre=?',
            [Nombre_padre, ApellidoPaterno_padre, ApellidoMaterno_padre, Telefono_padre, req.params.dni]
        );
        res.json({ message: 'Padre actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/padres/:dni', async (req, res) => {
    try {
        await pool.query('DELETE FROM Padre WHERE DNI_padre = ?', [req.params.dni]);
        res.json({ message: 'Padre eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== PROFESORES ==========
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
        const { Nombre_profesor, ApellidoPaterno_profesor, ApellidoMaterno_profesor } = req.body;
        const [result] = await pool.query(
            'INSERT INTO Profesor (Nombre_profesor, ApellidoPaterno_profesor, ApellidoMaterno_profesor) VALUES (?, ?, ?)',
            [Nombre_profesor, ApellidoPaterno_profesor, ApellidoMaterno_profesor]
        );
        res.status(201).json({ id: result.insertId, message: 'Profesor creado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/profesores/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM Profesor WHERE Codigo_profesor = ?', [req.params.id]);
        res.json({ message: 'Profesor eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== GRADOS ==========
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
        res.status(201).json({ id: result.insertId, message: 'Grado creado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== SECCIONES ==========
app.get('/api/secciones', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Seccion');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/secciones', async (req, res) => {
    try {
        const { Cantidad_alumnos, Letra } = req.body;
        const [result] = await pool.query('INSERT INTO Seccion (Cantidad_alumnos, Letra) VALUES (?, ?)', [Cantidad_alumnos, Letra]);
        res.status(201).json({ id: result.insertId, message: 'Sección creada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== MATERIAS ==========
app.get('/api/materias', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT m.*, g.Nivel_grado 
            FROM Materia m 
            LEFT JOIN Grado g ON m.Id_grado = g.Id_grado
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/materias', async (req, res) => {
    try {
        const { Nombre_materia, Id_grado } = req.body;
        const [result] = await pool.query('INSERT INTO Materia (Nombre_materia, Id_grado) VALUES (?, ?)', [Nombre_materia, Id_grado]);
        res.status(201).json({ id: result.insertId, message: 'Materia creada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== MATRÍCULAS ==========
app.get('/api/matriculas', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Matricula');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/matriculas', async (req, res) => {
    try {
        const { Estado_matricula, Fecha_Matricula } = req.body;
        const [result] = await pool.query(
            'INSERT INTO Matricula (Estado_matricula, Fecha_Matricula) VALUES (?, ?)',
            [Estado_matricula, Fecha_Matricula]
        );
        res.status(201).json({ id: result.insertId, message: 'Matrícula creada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== PAGOS ==========
app.get('/api/pagos', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.*, m.Estado_matricula 
            FROM Pago p 
            LEFT JOIN Matricula m ON p.Id_matricula = m.Id_Matricula
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
        res.status(201).json({ id: result.insertId, message: 'Pago registrado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== CALIFICACIONES ==========
app.get('/api/calificaciones', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Calificacion');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/calificaciones', async (req, res) => {
    try {
        const { NotaPractica, NotaExamen, NotaLaboratorio } = req.body;
        const [result] = await pool.query(
            'INSERT INTO Calificacion (NotaPractica, NotaExamen, NotaLaboratorio) VALUES (?, ?, ?)',
            [NotaPractica, NotaExamen, NotaLaboratorio]
        );
        res.status(201).json({ id: result.insertId, message: 'Calificación registrada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/calificaciones/:id', async (req, res) => {
    try {
        const { NotaPractica, NotaExamen, NotaLaboratorio } = req.body;
        await pool.query(
            'UPDATE Calificacion SET NotaPractica=?, NotaExamen=?, NotaLaboratorio=? WHERE Id_calificacion=?',
            [NotaPractica, NotaExamen, NotaLaboratorio, req.params.id]
        );
        res.json({ message: 'Calificación actualizada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== PERIODOS ACADÉMICOS ==========
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
        res.status(201).json({ id: result.insertId, message: 'Periodo creado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== LUGARES ==========
app.get('/api/lugares', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Lugar');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/lugares', async (req, res) => {
    try {
        const { lugar } = req.body;
        const [result] = await pool.query('INSERT INTO Lugar (lugar) VALUES (?)', [lugar]);
        res.status(201).json({ id: result.insertId, message: 'Lugar creado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== DIRECCIONES ==========
app.get('/api/direcciones', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Direccion');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/direcciones', async (req, res) => {
    try {
        const { Manzana, Lote, Distrito, Provincia, Calle, Referencia } = req.body;
        const [result] = await pool.query(
            'INSERT INTO Direccion (Manzana, Lote, Distrito, Provincia, Calle, Referencia) VALUES (?, ?, ?, ?, ?, ?)',
            [Manzana, Lote, Distrito, Provincia, Calle, Referencia]
        );
        res.status(201).json({ id: result.insertId, message: 'Dirección creada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== OCUPACIONES ==========
app.get('/api/ocupaciones', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Ocupacion');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/ocupaciones', async (req, res) => {
    try {
        const { Ocupacion } = req.body;
        const [result] = await pool.query('INSERT INTO Ocupacion (Ocupacion) VALUES (?)', [Ocupacion]);
        res.status(201).json({ id: result.insertId, message: 'Ocupación creada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== ESPECIALIDADES ==========
app.get('/api/especialidades', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Especialidad');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/especialidades', async (req, res) => {
    try {
        const { Nombre_especialidad } = req.body;
        const [result] = await pool.query('INSERT INTO Especialidad (Nombre_especialidad) VALUES (?)', [Nombre_especialidad]);
        res.status(201).json({ id: result.insertId, message: 'Especialidad creada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== HORARIOS ==========
app.get('/api/horarios', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Carga_Horaria');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/horarios', async (req, res) => {
    try {
        const { Hora_inicio, Hora_fin } = req.body;
        const [result] = await pool.query(
            'INSERT INTO Carga_Horaria (Hora_inicio, Hora_fin) VALUES (?, ?)',
            [Hora_inicio, Hora_fin]
        );
        res.status(201).json({ id: result.insertId, message: 'Horario creado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== TABLAS DE RELACIÓN ==========

// Profesor-Especialidad
app.get('/api/profesor-especialidad', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT pe.*, p.Nombre_profesor, p.ApellidoPaterno_profesor, e.Nombre_especialidad
            FROM Profesor_Especialidad pe
            JOIN Profesor p ON pe.Codigo_profesor = p.Codigo_profesor
            JOIN Especialidad e ON pe.Id_especialidad = e.Id_especialidad
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/profesor-especialidad', async (req, res) => {
    try {
        const { Codigo_profesor, Id_especialidad } = req.body;
        await pool.query(
            'INSERT INTO Profesor_Especialidad (Codigo_profesor, Id_especialidad) VALUES (?, ?)',
            [Codigo_profesor, Id_especialidad]
        );
        res.status(201).json({ message: 'Especialidad asignada al profesor' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Detalle Matrícula
app.get('/api/detalle-matricula', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT dm.*, p.Nombre_padre, g.Nivel_grado, m.Estado_matricula
            FROM Detalle_Matricula dm
            JOIN Padre p ON dm.DNI_Padre = p.DNI_padre
            JOIN Grado g ON dm.Id_grado = g.Id_grado
            JOIN Matricula m ON dm.Id_Matricula = m.Id_Matricula
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/detalle-matricula', async (req, res) => {
    try {
        const { DNI_Padre, Id_grado, Id_pago, Id_Matricula } = req.body;
        await pool.query(
            'INSERT INTO Detalle_Matricula (DNI_Padre, Id_grado, Id_pago, Id_Matricula) VALUES (?, ?, ?, ?)',
            [DNI_Padre, Id_grado, Id_pago, Id_Matricula]
        );
        res.status(201).json({ message: 'Detalle de matrícula creado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Detalle Calificación
app.get('/api/detalle-calificacion', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT dc.*, m.Nombre_materia, c.NotaPractica, c.NotaExamen, c.NotaLaboratorio
            FROM Detalle_Calificacion dc
            JOIN Materia m ON dc.Codigo_materia = m.Codigo_materia
            JOIN Calificacion c ON dc.Id_calificacion = c.Id_calificacion
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/detalle-calificacion', async (req, res) => {
    try {
        const { Codigo_materia, Id_periodo, Id_calificacion } = req.body;
        await pool.query(
            'INSERT INTO Detalle_Calificacion (Codigo_materia, Id_periodo, Id_calificacion) VALUES (?, ?, ?)',
            [Codigo_materia, Id_periodo, Id_calificacion]
        );
        res.status(201).json({ message: 'Detalle de calificación creado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Detalle Ocupación
app.post('/api/detalle-ocupacion', async (req, res) => {
    try {
        const { DNI_padre, Id_Ocupacion } = req.body;
        await pool.query(
            'INSERT INTO Detalle_Ocupacion (DNI_padre, Id_Ocupacion) VALUES (?, ?)',
            [DNI_padre, Id_Ocupacion]
        );
        res.status(201).json({ message: 'Ocupación asignada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    crearTablas();
});
