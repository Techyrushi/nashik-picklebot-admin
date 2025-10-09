import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilLockLocked, cilUser, cilLockUnlocked } from '@coreui/icons';
import { APIURL } from "@/config/const";

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(APIURL + '/api/auth/login', { username, password });
      const { token } = response.data;

      // Store token in local storage
      localStorage.setItem('token', token);

      // Redirect to admin dashboard
      navigate('/NashikPicklers');
    } catch (error) {
      // Display SweetAlert on login failure
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: 'Login failed. Please try again.',
        confirmButtonText: 'OK',
      }).then(() => {
        // Optionally clear the fields after an error
        setUsername('');
        setPassword('');
        navigate('/login'); // Redirect back to login
      });
    }
  };

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center"
      style={{ backgroundImage: 'url("/bg-img.png")', backgroundSize: 'cover' }}
    >
      <CContainer>
        <CRow className="justify-content-center mb-3">
          <CCol md={8} className="text-center">
            <img src="/myyvo_logo.png" alt="logo" width={200} />
          </CCol>
        </CRow>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup>
              <CCard className="p-4 border-0" style={{ background: "linear-gradient(80.67deg, #FBF6F1 10.63%, #F8EDE4 91.44%)" }}>
                <CCardBody>
                  <CForm onSubmit={handleLogin}>
                    <h1 style={{ color: "#A56F41" }}>Login</h1>
                    <p className="" style={{ color: "#000000" }}>Sign In to your account</p>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </CInputGroup>
                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type={showPassword ? "text" : "password"} // Toggle input type
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <CButton
                        type="button"
                        style={{ background: "#bcc2be", border: "none" }}
                        onClick={() => setShowPassword(!showPassword)} // Toggle visibility
                      >
                        <CIcon icon={showPassword ? cilLockUnlocked : cilLockLocked} /> {/* Toggle icon */}
                      </CButton>
                    </CInputGroup>
                    <CRow>
                      <CCol xs={12}>
                        <CButton type="submit" style={{ background: "#A56F41", color: "#ffffff" }} className="px-4">
                          Login
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
              <CCard className="text-white py-5 border-0" style={{ width: '44%', background: "linear-gradient(80.67deg, rgb(251 246 241 / 83%) 10.63%, rgb(248 237 228 / 8%) 91.44%)" }}>
                <CCardBody className="text-center">
                  <div>
                    <img src="/carts.png" alt="image" width={300} height={250} />
                  </div>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  );
};

export default Login;
