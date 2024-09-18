const express = require('express');
const connection = require('./db/connection');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(bodyParser.json());

app.get('/api/list_employees_all', (req, res) => {
  const managerId = req.query.MANAGER_ID;

  if (!managerId) {
    return res.status(400).json({ error: 'Manager ID is required' });
  }

  const sql = 'SELECT * FROM employees WHERE manager_id = ?';
  connection.query(sql, [managerId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Route for getting employee details by ID
app.get('/api/list_employee_details', (req, res) => {
  const empID = req.query.EMP;

  if (!empID) {
    return res.status(400).json({ error: 'Employee ID is required' });
  }

  const sql = 'SELECT * FROM employees WHERE EMP_ID = ?';
  connection.query(sql, [empID], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// POST route for login
app.post('/api/login', (req, res) => {

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Query to fetch the user details from credentials table
  const sql = 'SELECT username, password, emp_id FROM credentials WHERE username = ?';
  connection.query(sql, [username], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = results[0];

    // Validate the password
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // If validation is successful, fetch the designation from employee table
    const empId = user.emp_id;
    const empSql = 'SELECT designation FROM employees WHERE emp_id = ?';
    connection.query(empSql, [empId], (empErr, empResults) => {
      if (empErr) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (empResults.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      const designation = empResults[0].designation;

      // Return the validation message, employee ID, and designation
      res.json({
        message: 'Login successful',
        employee_id: empId,
        designation: designation,
      });
    });
  });
});
app.post('/api/add_employee', (req, res) => {
  const { 
    username, password, emp_user,emp_pass, emp_id, f_name, l_name, designation, 
    b_date, sex, address, job_id, salary, manager_id, dep_id 
  } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required to log in' });
  }

  // Validate login credentials first
  const sqlLogin = 'SELECT username, password FROM credentials WHERE username = ?';
  connection.query(sqlLogin, [username], (err, loginResults) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (loginResults.length === 0) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }
    const user = loginResults[0];
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    // Check if emp_id already exists in employees table
    const sqlCheck = 'SELECT EMP_ID FROM employees WHERE EMP_ID = ?';
    connection.query(sqlCheck, [emp_id], (checkErr, checkResults) => {
      if (checkErr) {
        console.log(checkErr)
        return res.status(500).json({ error: 'Database error' });
      }

      if (checkResults.length > 0) {
        return res.status(400).json({ error: 'Employee ID already exists, cannot create duplicate employee' });
      }

      // If emp_id doesn't exist, insert the new employee details
      const sqlInsert = 'INSERT INTO employees (EMP_ID, F_NAME,L_NAME, DESIGNATION,B_DATE,SEX,ADDRESS,JOB_ID,SALARY,MANAGER_ID,DEP_ID) VALUES (?, ?, ?, ?,?,?,?,?,?,?,?)';
      connection.query(sqlInsert, [ emp_id, f_name, l_name, designation, b_date, sex, address, job_id, salary, manager_id, dep_id], (insertErr, insertResults) => {
        if (insertErr) {
          return res.status(500).json({ error: 'Error inserting employee data' });
        }
      const sqlInsertcredentials = 'INSERT INTO credentials (username,password, emp_id) VALUES (?,?,?)'
      connection.query( sqlInsertcredentials, [ emp_user,emp_pass,emp_id], (insertCred, insertCredResults) => {
        if (insertCred) {
          return res.status(500).json({ error: 'Error inserting employee data' });
        }  
        res.status(201).json({
          message: 'Employee added successfully',
          employee_id:emp_id,
          emp_user,emp_pass, 
            f_name,
            l_name,
            designation,
            b_date,
            sex,
            address,
            job_id,
            salary,
            manager_id,
            dep_id
        });
      });
    });
  });
});
});
/*app.delete('/api/delete_employee', (req, res) => {
  const { username, password, emp_id } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required for authentication' });
  }

  if (!emp_id) {
    return res.status(400).json({ error: 'Employee ID is required to delete' });
  }

  // Authenticate using credentials
  const sqlLogin = 'SELECT username, password FROM credentials WHERE username = ?';
  connection.query(sqlLogin, [username], (err, loginResults) => {
    if (err) {
      console.error('Database error on login:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }

    if (loginResults.length === 0) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    const user = loginResults[0];

    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    // After authentication, proceed to delete the employee and credentials
    const sqlDeleteEmployee = 'DELETE FROM employees WHERE emp_id = ?';
    connection.query(sqlDeleteEmployee, [emp_id], (empErr, empResults) => {
      if (empErr) {
        console.error('Database error on employee delete:', empErr.message);
        return res.status(500).json({ error: 'Error deleting employee data' });
      }

      const sqlDeleteCredentials = 'DELETE FROM credentials WHERE emp_id = ?';
      connection.query(sqlDeleteCredentials, [emp_id], (credErr, credResults) => {
        if (credErr) {
          console.error('Database error on credentials delete:', credErr.message);
          return res.status(500).json({ error: 'Error deleting credentials' });
        }

        res.status(200).json({
          message: 'Employee and credentials deleted successfully',
          employee_id: emp_id
        });
      });
    });
  });
});*/
app.delete('/api/delete_employee', (req, res) => {
  const { username, password, emp_id } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required for authentication' });
  }

  if (!emp_id) {
    return res.status(400).json({ error: 'Employee ID is required to delete' });
  }
  
  // Authenticate using credentials
  const sqlLogin = 'SELECT username, password FROM credentials WHERE username = ?';
  connection.query(sqlLogin, [username], (err, loginResults) => {
    if (err) {
      console.error('Database error on login:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }

    if (loginResults.length === 0) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    const user = loginResults[0];

    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    // Proceed to delete credentials for the employee
    const sqlDeleteCredentials = 'DELETE FROM credentials WHERE emp_id = ?';
    connection.query(sqlDeleteCredentials, [emp_id], (credErr, credResults) => {
      if (credErr) {
        console.error('Database error on credentials delete:', credErr.message);
        return res.status(500).json({ error: 'Error deleting credentials' });
      }

      if (credResults.affectedRows === 0) {
        return res.status(404).json({ error: `Employee ID ${emp_id} does not exist in credentials` });
      }

      // Check if the employee exists before deleting from employees table
      const sqlCheckEmployee = 'SELECT emp_id FROM employees WHERE emp_id = ?';
      connection.query(sqlCheckEmployee, [emp_id], (checkErr, checkResults) => {
        if (checkErr) {
          console.error('Database error on employee check:', checkErr.message);
          return res.status(500).json({ error: 'Database error' });
        }

        if (checkResults.length === 0) {
          return res.status(404).json({ error: `Employee ID ${emp_id} does not exist in employees table` });
        }

        // Delete from employees table if emp_id exists
        const sqlDeleteEmployee = 'DELETE FROM employees WHERE emp_id = ?';
        connection.query(sqlDeleteEmployee, [emp_id], (empErr, empResults) => {
          if (empErr) {
            console.error('Database error on employee delete:', empErr.message);
            return res.status(500).json({ error: 'Error deleting employee data' });
          }

          res.status(200).json({
            message: `Employee and credentials deleted successfully for employee ID ${emp_id}`,
            employee_id: emp_id
          });
        });
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
