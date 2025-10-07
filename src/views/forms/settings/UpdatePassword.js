import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CButton,
  CRow,
} from '@coreui/react'
import axiosInstance from '@/config/axiosInstance'
import { APIURL, isSessionExpired } from '@/config/const'
import {jwtDecode} from 'jwt-decode'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'

const UpdatePassword = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [adminId, setAdminId] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const decodedToken = jwtDecode(token)
        setAdminId(decodedToken.sub) // Assuming the token payload contains `sub` for the admin ID
        setEmail(decodedToken.email || '') // Pre-fill email if available
      } catch (error) {
        console.error('Invalid token:', error)
        Swal.fire({
          title: 'Error',
          text: 'Invalid token. Please log in again.',
          icon: 'error',
          confirmButtonText: 'Login',
        }).then(() => navigate('/login'))
      }
    } else {
      Swal.fire({
        title: 'Error',
        text: 'No token found. Please log in.',
        icon: 'error',
        confirmButtonText: 'Login',
      }).then(() => navigate('/login'))
    }
  }, [navigate])

  useEffect(() => {
    if (isSessionExpired()) {
      Swal.fire({
        title: 'Session Expired',
        text: 'Your session has expired. Please log in again.',
        icon: 'error',
        confirmButtonText: 'Login',
      }).then(() => navigate('/login'))
    }
  }, [navigate])

  const handleBack = () => {
    navigate('/dashboard')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({}) // Reset errors

    // Basic client-side validations
    if (!password || !confirmPassword) {
      setErrors({ general: 'Both password fields are required.' })
      return
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match!' })
      return
    }

    if (!adminId) {
      setErrors({ general: 'Invalid admin ID. Please log in again.' })
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await axiosInstance.patch(
        `${APIURL}admin/${adminId}`,
        { email, password },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      )
      Swal.fire({
        title: 'Success',
        text: response.data.message || 'Password updated successfully!',
        icon: 'success',
        confirmButtonText: 'OK',
      })
      setPassword('')
      setConfirmPassword('')
    } catch (error) {
      const errorData = error.response?.data
      const parsedErrors = {}
      if (errorData?.message) {
        if (Array.isArray(errorData.message)) {
          errorData.message.forEach((err) => {
            if (err.property && err.constraints) {
              parsedErrors[err.property] = Object.values(err.constraints).join('. ')
            }
          })
        } else {
          parsedErrors.general = errorData.message
        }
      } else {
        parsedErrors.general = 'Failed to update password. Please try again.'
      }
      setErrors(parsedErrors)
      console.error('Error updating password:', error)
    }
  }

  return (
    <CRow className="justify-content-center mt-4">
      <CCol md={6}>
        <CCard>
          <CCardHeader>
            <h5>Update Password</h5>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit}>
              <div className="mb-3">
                <CFormLabel htmlFor="email">Email</CFormLabel>
                <CFormInput type="email" id="email" value={email} readOnly />
              </div>
              <div className="mb-3">
                <CFormLabel htmlFor="password">New Password</CFormLabel>
                <div className="input-group">
                  <CFormInput
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span
                    className="input-group-text"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </span>
                </div>
                {errors.password && <p className="text-danger fw-bold">{errors.password}</p>}
              </div>
              <div className="mb-3">
                <CFormLabel htmlFor="confirmPassword">Confirm Password</CFormLabel>
                <div className="input-group">
                  <CFormInput
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <span
                    className="input-group-text"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                  </span>
                </div>
                {errors.confirmPassword && <p className="text-danger fw-bold">{errors.confirmPassword}</p>}
              </div>
              {errors.general && <p className="text-danger fw-bold">{errors.general}</p>}
              <CButton type="submit" color="primary">
                Update Password
              </CButton>
              <CButton color="secondary" onClick={handleBack} style={{ marginLeft: '10px', width: '80px' }}>
                Back
              </CButton>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default UpdatePassword
