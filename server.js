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

        // Tabla Estudiantes (SOLO datos personales - sin dirección según modelo físico)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Estudiantes (
                DNI_estudiante VARCHAR(20) PRIMARY KEY,
                Nombre_estudiante VARCHAR(100) NOT NULL,
                ApellidoPaterno_estudiante VARCHAR(100) NOT NULL,
                ApellidoMaterno_estudiante VARCHAR(100) NOT NULL,
                Sexo CHAR(1) NOT NULL,
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
                Codigo_profesor INT PRIMARY KEY,
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

        // Tabla Direccion_Estudiante (relaciona Estudiante con Dirección)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Direccion_Estudiante (
                DNI_estudiante VARCHAR(20),
                Id_Direccion INT,
                DNI_padre INT,
                PRIMARY KEY (DNI_estudiante, Id_Direccion),
                FOREIGN KEY (DNI_estudiante) REFERENCES Estudiantes(DNI_estudiante) ON DELETE CASCADE,
                FOREIGN KEY (Id_Direccion) REFERENCES Direccion(Id_Direccion) ON DELETE CASCADE,
                FOREIGN KEY (DNI_padre) REFERENCES Padre(DNI_padre)
            )
        `);

        // Tabla Lugar_Estudiante (relaciona Estudiante con Lugar de nacimiento)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Lugar_Estudiante (
                DNI_estudiante VARCHAR(20),
                Id_lugar INT,
                PRIMARY KEY (DNI_estudiante, Id_lugar),
                FOREIGN KEY (DNI_estudiante) REFERENCES Estudiantes(DNI_estudiante) ON DELETE CASCADE,
                FOREIGN KEY (Id_lugar) REFERENCES Lugar(Id_lugar) ON DELETE CASCADE
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

        // Tabla Estudiante_Padre (relación entre estudiante y padre/apoderado)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Estudiante_Padre (
                DNI_estudiante VARCHAR(20),
                DNI_padre INT,
                Parentesco VARCHAR(50) DEFAULT 'Padre/Madre',
                PRIMARY KEY (DNI_estudiante, DNI_padre),
                FOREIGN KEY (DNI_estudiante) REFERENCES Estudiantes(DNI_estudiante) ON DELETE CASCADE,
                FOREIGN KEY (DNI_padre) REFERENCES Padre(DNI_padre) ON DELETE CASCADE
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
            horarios: '/api/horarios',
            verificar: '/api/verificar-tablas'
        }
    });
});

// ========== VERIFICAR TABLAS (para debug) ==========
app.get('/api/verificar-tablas', async (req, res) => {
    try {
        const [estudiantes] = await pool.query('SELECT * FROM Estudiantes');
        const [direcciones] = await pool.query('SELECT * FROM Direccion');
        const [direccionEstudiante] = await pool.query('SELECT * FROM Direccion_Estudiante');
        const [lugares] = await pool.query('SELECT * FROM Lugar');
        const [lugarEstudiante] = await pool.query('SELECT * FROM Lugar_Estudiante');
        const [padres] = await pool.query('SELECT * FROM Padre');
        const [estudiantePadre] = await pool.query('SELECT * FROM Estudiante_Padre');
        const [ocupaciones] = await pool.query('SELECT * FROM Ocupacion');
        const [detalleOcupacion] = await pool.query('SELECT * FROM Detalle_Ocupacion');
        
        res.json({
            mensaje: 'Contenido de las tablas relacionales',
            tablas: {
                '=== ESTUDIANTES ===': '---',
                '1_Estudiantes (datos personales)': estudiantes,
                '2_Direccion (direcciones)': direcciones,
                '3_Direccion_Estudiante (relacion)': direccionEstudiante,
                '4_Lugar (lugares de nacimiento)': lugares,
                '5_Lugar_Estudiante (relacion)': lugarEstudiante,
                '6_Estudiante_Padre (relacion)': estudiantePadre,
                '=== PADRES ===': '---',
                '7_Padre (datos del padre)': padres,
                '8_Ocupacion (ocupaciones)': ocupaciones,
                '9_Detalle_Ocupacion (relacion padre-ocupacion)': detalleOcupacion
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== RESET TABLAS (TEMPORAL) ==========
app.get('/api/reset-tablas', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        // Desactivar verificación de foreign keys
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        
        // Eliminar tablas existentes
        const tablasEliminar = [
            'Estudiante_Padre', 'Lugar_Estudiante', 'Direccion_Estudiante',
            'Detalle_Calificacion', 'Detalle_Matricula', 'Detalle_Ocupacion',
            'Lugar_Nacimiento_Estudiante', 'Profesor_Especialidad',
            'Profesor_Materia', 'Detalle_Seccion', 'Detalle_Horario_Seccion', 'Profesor_Horario',
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
// GET - Obtener todos los estudiantes con sus relaciones
app.get('/api/estudiantes', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                e.DNI_estudiante,
                e.Nombre_estudiante,
                e.ApellidoPaterno_estudiante,
                e.ApellidoMaterno_estudiante,
                e.Sexo,
                e.Fecha_nacimiento,
                ep.DNI_padre,
                CONCAT(p.Nombre_padre, ' ', p.ApellidoPaterno_padre) as Nombre_padre,
                p.ApellidoPaterno_padre,
                d.Provincia,
                d.Distrito,
                d.Manzana,
                d.Lote,
                d.Calle,
                d.Referencia,
                l.lugar as Lugar_nacimiento
            FROM Estudiantes e
            LEFT JOIN Estudiante_Padre ep ON e.DNI_estudiante = ep.DNI_estudiante
            LEFT JOIN Padre p ON ep.DNI_padre = p.DNI_padre
            LEFT JOIN Direccion_Estudiante de ON e.DNI_estudiante = de.DNI_estudiante
            LEFT JOIN Direccion d ON de.Id_Direccion = d.Id_Direccion
            LEFT JOIN Lugar_Estudiante le ON e.DNI_estudiante = le.DNI_estudiante
            LEFT JOIN Lugar l ON le.Id_lugar = l.Id_lugar
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error en GET estudiantes:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - Obtener estudiante por DNI con todas sus relaciones
app.get('/api/estudiantes/:dni', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                e.DNI_estudiante,
                e.Nombre_estudiante,
                e.ApellidoPaterno_estudiante,
                e.ApellidoMaterno_estudiante,
                e.Sexo,
                e.Fecha_nacimiento,
                ep.DNI_padre,
                d.Provincia,
                d.Distrito,
                d.Manzana,
                d.Lote,
                d.Calle,
                d.Referencia,
                l.lugar as Lugar_nacimiento
            FROM Estudiantes e
            LEFT JOIN Estudiante_Padre ep ON e.DNI_estudiante = ep.DNI_estudiante
            LEFT JOIN Direccion_Estudiante de ON e.DNI_estudiante = de.DNI_estudiante
            LEFT JOIN Direccion d ON de.Id_Direccion = d.Id_Direccion
            LEFT JOIN Lugar_Estudiante le ON e.DNI_estudiante = le.DNI_estudiante
            LEFT JOIN Lugar l ON le.Id_lugar = l.Id_lugar
            WHERE e.DNI_estudiante = ?
        `, [req.params.dni]);
        
        if (rows.length === 0) return res.status(404).json({ error: 'Estudiante no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST - Crear estudiante con datos en tablas relacionales
app.post('/api/estudiantes', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { 
            DNI_estudiante, 
            Nombre_estudiante, 
            ApellidoPaterno_estudiante, 
            ApellidoMaterno_estudiante, 
            Sexo, 
            Fecha_nacimiento, 
            DNI_padre,
            Lugar_nacimiento,
            Provincia,
            Distrito,
            Manzana,
            Lote,
            Calle,
            Referencia
        } = req.body;

        // 1. Guardar en tabla Estudiantes (SOLO datos personales)
        await connection.query(
            'INSERT INTO Estudiantes (DNI_estudiante, Nombre_estudiante, ApellidoPaterno_estudiante, ApellidoMaterno_estudiante, Sexo, Fecha_nacimiento) VALUES (?, ?, ?, ?, ?, ?)',
            [DNI_estudiante, Nombre_estudiante, ApellidoPaterno_estudiante, ApellidoMaterno_estudiante, Sexo, Fecha_nacimiento]
        );
        console.log('✅ Paso 1: Estudiante guardado en tabla Estudiantes');

        // 2. Guardar dirección en tabla Direccion y relacionar
        if (Provincia || Distrito || Manzana || Lote || Calle || Referencia) {
            const [resultDir] = await connection.query(
                'INSERT INTO Direccion (Provincia, Distrito, Manzana, Lote, Calle, Referencia) VALUES (?, ?, ?, ?, ?, ?)',
                [Provincia || null, Distrito || null, Manzana || null, Lote || null, Calle || null, Referencia || null]
            );
            const Id_Direccion = resultDir.insertId;
            console.log('✅ Paso 2: Dirección guardada en tabla Direccion con Id:', Id_Direccion);

            // 3. Relacionar en direccion_estudiante
            await connection.query(
                'INSERT INTO Direccion_Estudiante (DNI_estudiante, Id_Direccion, DNI_padre) VALUES (?, ?, ?)',
                [DNI_estudiante, Id_Direccion, DNI_padre || null]
            );
            console.log('✅ Paso 3: Relación creada en Direccion_Estudiante');
        }

        // 4. Guardar lugar de nacimiento en tabla Lugar y relacionar
        if (Lugar_nacimiento) {
            // Verificar si el lugar ya existe
            const [lugarExistente] = await connection.query(
                'SELECT Id_lugar FROM Lugar WHERE lugar = ?',
                [Lugar_nacimiento]
            );

            let Id_lugar;
            if (lugarExistente.length > 0) {
                Id_lugar = lugarExistente[0].Id_lugar;
            } else {
                const [resultLugar] = await connection.query(
                    'INSERT INTO Lugar (lugar) VALUES (?)',
                    [Lugar_nacimiento]
                );
                Id_lugar = resultLugar.insertId;
            }
            console.log('✅ Paso 4: Lugar de nacimiento guardado con Id:', Id_lugar);

            // 5. Relacionar en Lugar_Estudiante
            await connection.query(
                'INSERT INTO Lugar_Estudiante (DNI_estudiante, Id_lugar) VALUES (?, ?)',
                [DNI_estudiante, Id_lugar]
            );
            console.log('✅ Paso 5: Relación creada en Lugar_Estudiante');
        }

        // 6. Relacionar estudiante con padre
        if (DNI_padre) {
            await connection.query(
                'INSERT INTO Estudiante_Padre (DNI_estudiante, DNI_padre) VALUES (?, ?)',
                [DNI_estudiante, DNI_padre]
            );
            console.log('✅ Paso 6: Relación creada en Estudiante_Padre');
        }

        await connection.commit();
        res.status(201).json({ 
            dni: DNI_estudiante, 
            message: 'Estudiante registrado correctamente en todas las tablas relacionales' 
        });
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error al crear estudiante:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Ya existe un estudiante con ese DNI' });
        } else {
            res.status(500).json({ error: error.message });
        }
    } finally {
        connection.release();
    }
});

// PUT - Actualizar estudiante con datos en tablas relacionales
app.put('/api/estudiantes/:dni', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { 
            Nombre_estudiante, 
            ApellidoPaterno_estudiante, 
            ApellidoMaterno_estudiante, 
            Sexo, 
            Fecha_nacimiento,
            DNI_padre,
            Lugar_nacimiento,
            Provincia,
            Distrito,
            Manzana,
            Lote,
            Calle,
            Referencia
        } = req.body;

        // 1. Actualizar datos personales del estudiante
        await connection.query(
            'UPDATE Estudiantes SET Nombre_estudiante=?, ApellidoPaterno_estudiante=?, ApellidoMaterno_estudiante=?, Sexo=?, Fecha_nacimiento=? WHERE DNI_estudiante=?',
            [Nombre_estudiante, ApellidoPaterno_estudiante, ApellidoMaterno_estudiante, Sexo, Fecha_nacimiento, req.params.dni]
        );

        // 2. Actualizar dirección
        if (Provincia || Distrito || Manzana || Lote || Calle || Referencia) {
            // Obtener dirección actual
            const [dirActual] = await connection.query(
                'SELECT Id_Direccion FROM Direccion_Estudiante WHERE DNI_estudiante = ?',
                [req.params.dni]
            );

            if (dirActual.length > 0 && dirActual[0].Id_Direccion) {
                // Actualizar dirección existente
                await connection.query(
                    'UPDATE Direccion SET Provincia=?, Distrito=?, Manzana=?, Lote=?, Calle=?, Referencia=? WHERE Id_Direccion=?',
                    [Provincia || null, Distrito || null, Manzana || null, Lote || null, Calle || null, Referencia || null, dirActual[0].Id_Direccion]
                );
            } else {
                // Crear nueva dirección y relación
                const [resultDir] = await connection.query(
                    'INSERT INTO Direccion (Provincia, Distrito, Manzana, Lote, Calle, Referencia) VALUES (?, ?, ?, ?, ?, ?)',
                    [Provincia || null, Distrito || null, Manzana || null, Lote || null, Calle || null, Referencia || null]
                );
                await connection.query(
                    'INSERT INTO Direccion_Estudiante (DNI_estudiante, Id_Direccion, DNI_padre) VALUES (?, ?, ?)',
                    [req.params.dni, resultDir.insertId, DNI_padre || null]
                );
            }
        }

        // 3. Actualizar lugar de nacimiento
        if (Lugar_nacimiento) {
            // Verificar si el lugar ya existe
            const [lugarExistente] = await connection.query(
                'SELECT Id_lugar FROM Lugar WHERE lugar = ?',
                [Lugar_nacimiento]
            );

            let Id_lugar;
            if (lugarExistente.length > 0) {
                Id_lugar = lugarExistente[0].Id_lugar;
            } else {
                const [resultLugar] = await connection.query(
                    'INSERT INTO Lugar (lugar) VALUES (?)',
                    [Lugar_nacimiento]
                );
                Id_lugar = resultLugar.insertId;
            }

            // Verificar si ya tiene lugar asignado
            const [lugarActual] = await connection.query(
                'SELECT Id_lugar FROM Lugar_Estudiante WHERE DNI_estudiante = ?',
                [req.params.dni]
            );

            if (lugarActual.length > 0) {
                await connection.query(
                    'UPDATE Lugar_Estudiante SET Id_lugar = ? WHERE DNI_estudiante = ?',
                    [Id_lugar, req.params.dni]
                );
            } else {
                await connection.query(
                    'INSERT INTO Lugar_Estudiante (DNI_estudiante, Id_lugar) VALUES (?, ?)',
                    [req.params.dni, Id_lugar]
                );
            }
        }

        // 4. Actualizar relación con padre
        if (DNI_padre) {
            await connection.query('DELETE FROM Estudiante_Padre WHERE DNI_estudiante = ?', [req.params.dni]);
            await connection.query('INSERT INTO Estudiante_Padre (DNI_estudiante, DNI_padre) VALUES (?, ?)', [req.params.dni, DNI_padre]);
        }

        await connection.commit();
        res.json({ message: 'Estudiante actualizado correctamente' });
    } catch (error) {
        await connection.rollback();
        console.error('Error al actualizar estudiante:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// DELETE - Eliminar estudiante y sus relaciones
app.delete('/api/estudiantes/:dni', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Obtener Id_Direccion antes de eliminar
        const [dirAsoc] = await connection.query(
            'SELECT Id_Direccion FROM Direccion_Estudiante WHERE DNI_estudiante = ?',
            [req.params.dni]
        );

        // 2. Eliminar de Lugar_Estudiante
        await connection.query('DELETE FROM Lugar_Estudiante WHERE DNI_estudiante = ?', [req.params.dni]);
        
        // 3. Eliminar de Direccion_Estudiante
        await connection.query('DELETE FROM Direccion_Estudiante WHERE DNI_estudiante = ?', [req.params.dni]);

        // 4. Eliminar de Estudiante_Padre
        await connection.query('DELETE FROM Estudiante_Padre WHERE DNI_estudiante = ?', [req.params.dni]);

        // 5. Eliminar del Estudiante
        await connection.query('DELETE FROM Estudiantes WHERE DNI_estudiante = ?', [req.params.dni]);

        // 6. Eliminar dirección si no está siendo usada por otro estudiante
        if (dirAsoc.length > 0 && dirAsoc[0].Id_Direccion) {
            const [otrosEstudiantes] = await connection.query(
                'SELECT COUNT(*) as count FROM Direccion_Estudiante WHERE Id_Direccion = ?',
                [dirAsoc[0].Id_Direccion]
            );
            if (otrosEstudiantes[0].count === 0) {
                await connection.query('DELETE FROM Direccion WHERE Id_Direccion = ?', [dirAsoc[0].Id_Direccion]);
            }
        }

        await connection.commit();
        res.json({ message: 'Estudiante eliminado correctamente' });
    } catch (error) {
        await connection.rollback();
        console.error('Error al eliminar estudiante:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// ========== PADRES ==========
// GET todos los padres con su ocupación
app.get('/api/padres', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.*, o.Ocupacion 
            FROM Padre p
            LEFT JOIN Detalle_Ocupacion do ON p.DNI_padre = do.DNI_padre
            LEFT JOIN Ocupacion o ON do.Id_Ocupacion = o.Id_Ocupacion
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET un padre específico con su ocupación
app.get('/api/padres/:dni', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.*, o.Ocupacion 
            FROM Padre p
            LEFT JOIN Detalle_Ocupacion do ON p.DNI_padre = do.DNI_padre
            LEFT JOIN Ocupacion o ON do.Id_Ocupacion = o.Id_Ocupacion
            WHERE p.DNI_padre = ?
        `, [req.params.dni]);
        if (rows.length === 0) return res.status(404).json({ error: 'Padre no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST nuevo padre con ocupación (transacción)
app.post('/api/padres', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { DNI_padre, Nombre_padre, ApellidoPaterno_padre, ApellidoMaterno_padre, Telefono_padre, Ocupacion } = req.body;
        
        // 1. Insertar en tabla Padre
        await connection.query(
            'INSERT INTO Padre (DNI_padre, Nombre_padre, ApellidoPaterno_padre, ApellidoMaterno_padre, Telefono_padre) VALUES (?, ?, ?, ?, ?)',
            [DNI_padre, Nombre_padre, ApellidoPaterno_padre, ApellidoMaterno_padre, Telefono_padre]
        );
        
        // 2. Si hay ocupación, insertar en Ocupacion y Detalle_Ocupacion
        if (Ocupacion && Ocupacion.trim() !== '') {
            // Verificar si la ocupación ya existe
            const [existingOcupacion] = await connection.query(
                'SELECT Id_Ocupacion FROM Ocupacion WHERE Ocupacion = ?',
                [Ocupacion.trim()]
            );
            
            let ocupacionId;
            if (existingOcupacion.length > 0) {
                ocupacionId = existingOcupacion[0].Id_Ocupacion;
            } else {
                // Crear nueva ocupación
                const [resultOcupacion] = await connection.query(
                    'INSERT INTO Ocupacion (Ocupacion) VALUES (?)',
                    [Ocupacion.trim()]
                );
                ocupacionId = resultOcupacion.insertId;
            }
            
            // Crear relación en Detalle_Ocupacion
            await connection.query(
                'INSERT INTO Detalle_Ocupacion (DNI_padre, Id_Ocupacion) VALUES (?, ?)',
                [DNI_padre, ocupacionId]
            );
        }
        
        await connection.commit();
        res.status(201).json({ message: 'Padre registrado correctamente' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// PUT actualizar padre con ocupación (transacción)
app.put('/api/padres/:dni', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { Nombre_padre, ApellidoPaterno_padre, ApellidoMaterno_padre, Telefono_padre, Ocupacion } = req.body;
        const dni = req.params.dni;
        
        // 1. Actualizar tabla Padre
        await connection.query(
            'UPDATE Padre SET Nombre_padre=?, ApellidoPaterno_padre=?, ApellidoMaterno_padre=?, Telefono_padre=? WHERE DNI_padre=?',
            [Nombre_padre, ApellidoPaterno_padre, ApellidoMaterno_padre, Telefono_padre, dni]
        );
        
        // 2. Eliminar ocupación anterior del padre
        await connection.query('DELETE FROM Detalle_Ocupacion WHERE DNI_padre = ?', [dni]);
        
        // 3. Si hay ocupación nueva, insertar
        if (Ocupacion && Ocupacion.trim() !== '') {
            // Verificar si la ocupación ya existe
            const [existingOcupacion] = await connection.query(
                'SELECT Id_Ocupacion FROM Ocupacion WHERE Ocupacion = ?',
                [Ocupacion.trim()]
            );
            
            let ocupacionId;
            if (existingOcupacion.length > 0) {
                ocupacionId = existingOcupacion[0].Id_Ocupacion;
            } else {
                // Crear nueva ocupación
                const [resultOcupacion] = await connection.query(
                    'INSERT INTO Ocupacion (Ocupacion) VALUES (?)',
                    [Ocupacion.trim()]
                );
                ocupacionId = resultOcupacion.insertId;
            }
            
            // Crear relación en Detalle_Ocupacion
            await connection.query(
                'INSERT INTO Detalle_Ocupacion (DNI_padre, Id_Ocupacion) VALUES (?, ?)',
                [dni, ocupacionId]
            );
        }
        
        await connection.commit();
        res.json({ message: 'Padre actualizado correctamente' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// DELETE padre (eliminar relaciones primero)
app.delete('/api/padres/:dni', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const dni = req.params.dni;
        
        // 1. Eliminar de Detalle_Ocupacion
        await connection.query('DELETE FROM Detalle_Ocupacion WHERE DNI_padre = ?', [dni]);
        
        // 2. Eliminar de Estudiante_Padre
        await connection.query('DELETE FROM Estudiante_Padre WHERE DNI_padre = ?', [dni]);
        
        // 3. Eliminar de Direccion_Estudiante (donde sea el padre)
        await connection.query('DELETE FROM Direccion_Estudiante WHERE DNI_padre = ?', [dni]);
        
        // 4. Eliminar el padre
        await connection.query('DELETE FROM Padre WHERE DNI_padre = ?', [dni]);
        
        await connection.commit();
        res.json({ message: 'Padre eliminado correctamente' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// ========== PROFESORES ==========
app.get('/api/profesores', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.*, 
                   GROUP_CONCAT(DISTINCT e.Nombre_especialidad SEPARATOR ', ') as Especialidades,
                   GROUP_CONCAT(DISTINCT CONCAT(ch.Hora_inicio, ' - ', ch.Hora_fin) SEPARATOR ', ') as Horarios
            FROM Profesor p
            LEFT JOIN Profesor_Especialidad pe ON p.Codigo_profesor = pe.Codigo_profesor
            LEFT JOIN Especialidad e ON pe.Id_especialidad = e.Id_especialidad
            LEFT JOIN Profesor_Horario ph ON p.Codigo_profesor = ph.Codigo_profesor
            LEFT JOIN Carga_Horaria ch ON ph.Id_horario = ch.Id_horario
            GROUP BY p.Codigo_profesor
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/profesores/:id', async (req, res) => {
    try {
        const [profesor] = await pool.query('SELECT * FROM Profesor WHERE Codigo_profesor = ?', [req.params.id]);
        if (profesor.length === 0) {
            return res.status(404).json({ error: 'Profesor no encontrado' });
        }
        
        // Obtener especialidades del profesor
        const [especialidades] = await pool.query(
            'SELECT Id_especialidad FROM Profesor_Especialidad WHERE Codigo_profesor = ?',
            [req.params.id]
        );
        
        // Obtener horarios del profesor
        const [horarios] = await pool.query(
            'SELECT Id_horario FROM Profesor_Horario WHERE Codigo_profesor = ?',
            [req.params.id]
        );
        
        res.json({
            ...profesor[0],
            especialidades: especialidades.map(e => e.Id_especialidad),
            horarios: horarios.map(h => h.Id_horario)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/profesores', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { Codigo_profesor, Nombre_profesor, ApellidoPaterno_profesor, ApellidoMaterno_profesor, especialidades, horarios } = req.body;
        
        // Insertar profesor
        await connection.query(
            'INSERT INTO Profesor (Codigo_profesor, Nombre_profesor, ApellidoPaterno_profesor, ApellidoMaterno_profesor) VALUES (?, ?, ?, ?)',
            [Codigo_profesor, Nombre_profesor, ApellidoPaterno_profesor, ApellidoMaterno_profesor]
        );
        
        // Insertar especialidades si existen
        if (especialidades && especialidades.length > 0) {
            for (const idEsp of especialidades) {
                await connection.query(
                    'INSERT INTO Profesor_Especialidad (Codigo_profesor, Id_especialidad) VALUES (?, ?)',
                    [Codigo_profesor, idEsp]
                );
            }
        }
        
        // Insertar horarios si existen
        if (horarios && horarios.length > 0) {
            for (const idHor of horarios) {
                await connection.query(
                    'INSERT INTO Profesor_Horario (Codigo_profesor, Id_horario) VALUES (?, ?)',
                    [Codigo_profesor, idHor]
                );
            }
        }
        
        await connection.commit();
        res.status(201).json({ id: Codigo_profesor, message: 'Profesor creado correctamente' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

app.put('/api/profesores/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { Nombre_profesor, ApellidoPaterno_profesor, ApellidoMaterno_profesor, especialidades, horarios } = req.body;
        const codigoProfesor = req.params.id;
        
        // Actualizar datos del profesor
        await connection.query(
            'UPDATE Profesor SET Nombre_profesor = ?, ApellidoPaterno_profesor = ?, ApellidoMaterno_profesor = ? WHERE Codigo_profesor = ?',
            [Nombre_profesor, ApellidoPaterno_profesor, ApellidoMaterno_profesor, codigoProfesor]
        );
        
        // Eliminar especialidades anteriores y agregar nuevas
        await connection.query('DELETE FROM Profesor_Especialidad WHERE Codigo_profesor = ?', [codigoProfesor]);
        if (especialidades && especialidades.length > 0) {
            for (const idEsp of especialidades) {
                await connection.query(
                    'INSERT INTO Profesor_Especialidad (Codigo_profesor, Id_especialidad) VALUES (?, ?)',
                    [codigoProfesor, idEsp]
                );
            }
        }
        
        // Eliminar horarios anteriores y agregar nuevos
        await connection.query('DELETE FROM Profesor_Horario WHERE Codigo_profesor = ?', [codigoProfesor]);
        if (horarios && horarios.length > 0) {
            for (const idHor of horarios) {
                await connection.query(
                    'INSERT INTO Profesor_Horario (Codigo_profesor, Id_horario) VALUES (?, ?)',
                    [codigoProfesor, idHor]
                );
            }
        }
        
        await connection.commit();
        res.json({ message: 'Profesor actualizado correctamente' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

app.delete('/api/profesores/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Eliminar relaciones primero
        await connection.query('DELETE FROM Profesor_Especialidad WHERE Codigo_profesor = ?', [req.params.id]);
        await connection.query('DELETE FROM Profesor_Horario WHERE Codigo_profesor = ?', [req.params.id]);
        
        // Eliminar profesor
        await connection.query('DELETE FROM Profesor WHERE Codigo_profesor = ?', [req.params.id]);
        
        await connection.commit();
        res.json({ message: 'Profesor eliminado' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
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
