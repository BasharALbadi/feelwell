import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { UsersData } from "../Exampledata";
import axios from "axios";

import * as ENV from "../config";

//const initialState = { value: [] }; //list of user is an object with empty array as initial value
const initialState = {
  value: UsersData,
  logged: "",
  user: {},
  isLoading: false,
  isSuccess: false,
  isError: false,
  errorMessage: ""
};

//Create the thunk for register
export const registerUser = createAsyncThunk(
  "users/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      // Connect to the real backend API
      const registerUrl = `${ENV.SERVER_URL.replace('/api', '')}/registerUser`;
      console.log("Attempting registration at:", registerUrl);
      
      const response = await axios.post(registerUrl, {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        userType: userData.userType || 'user',
        ...(userData.userType === 'doctor' && {
          specialization: userData.specialization,
          experience: userData.experience
        })
      });
      return response.data.user;
    } catch (error) {
      console.error("Registration error:", error);
      return rejectWithValue(error.response?.data?.message || "Registration failed");
    }
  }
);

//Create the thunk for login
export const login = createAsyncThunk(
  "users/login", 
  async (userData, { rejectWithValue }) => {
    try {
      // Corregir la ruta eliminando "/api" de la URL si es necesario
      const loginUrl = `${ENV.SERVER_URL.replace('/api', '')}/login`;
      console.log("Attempting login to:", loginUrl);
      
      const response = await axios.post(loginUrl, {
        email: userData.email,
        password: userData.password,
        userType: userData.userType || 'user',
      });
      
      return response.data.user;
    } catch (error) {
      console.error("Login error:", error);
      return rejectWithValue(error.response?.data?.error || "Login failed");
    }
  }
);

//thunk for logout
export const logout = createAsyncThunk(
  "/users/logout", 
  async (_, { rejectWithValue }) => {
    try {
      const logoutUrl = `${ENV.SERVER_URL.replace('/api', '')}/logout`;
      console.log("Attempting logout at:", logoutUrl);
      
      const response = await axios.post(logoutUrl);
      return response.data;
    } catch (error) {
      console.error("Logout error:", error);
      return rejectWithValue(error.response?.data?.error || "Logout failed");
    }
  }
);

// Thunk for updating user profile
export const updateUserProfile = createAsyncThunk(
  "users/updateUserProfile", 
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${ENV.SERVER_URL}/updateUserProfile`, userData);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Profile update failed");
    }
  }
);

// New action to fetch all doctors
export const fetchDoctors = createAsyncThunk(
  'users/fetchDoctors',
  async (_, { rejectWithValue }) => {
    try {
      console.log("Fetching doctors from:", `${ENV.SERVER_URL}/getDoctors`);
      // Force port 3001 if not specified
      const serverUrl = ENV.SERVER_URL.includes(":3001") ? ENV.SERVER_URL : "http://localhost:3001";
      const response = await axios.get(`${serverUrl}/getDoctors`);
      console.log("Doctors response:", response.data);
      return response.data.doctors;
    } catch (error) {
      console.error("Error fetching doctors:", error.response || error);
      return rejectWithValue(error.response?.data || error.message || "Failed to fetch doctors");
    }
  }
);

export const userSlice = createSlice({
  name: "users",
  initialState: {
    ...initialState,
    doctors: [],
    doctorsLoading: false,
    doctorsError: null
  },
  reducers: {
    addUser: (state, action) => {
      state.value.push(action.payload);
    },
    deleteUser: (state, action) => {
      state.value = state.value.filter((user) => user.email !== action.payload);
    },
    updateUser: (state, action) => {
      state.value.map((user) => {
        if (user.email === action.payload.email) {
          user.name = action.payload.name;
          user.password = action.payload.password;
        }
      });
    },
    clearErrors: (state) => {
      state.isError = false;
      state.errorMessage = "";
    }
  },

  extraReducers: (builder) => {
    //extrareducer for register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
        state.isError = false;
        state.errorMessage = "";
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Don't store the user on registration, they need to login
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload || "Registration failed";
      })

      //extrareducer for login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
        state.isError = false;
        state.errorMessage = "";
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload || "Login failed";
      })

      //extrareducer for logout
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = {};
        state.isLoading = false;
        state.isSuccess = false;
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload || "Logout failed";
      })

      // Reducer for update user profile
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload };
        state.isLoading = false;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload || "Profile update failed";
      })
      
      // Reducers for fetching doctors
      .addCase(fetchDoctors.pending, (state) => {
        state.doctorsLoading = true;
        state.doctorsError = null;
      })
      .addCase(fetchDoctors.fulfilled, (state, action) => {
        state.doctorsLoading = false;
        state.doctors = action.payload;
      })
      .addCase(fetchDoctors.rejected, (state, action) => {
        state.doctorsLoading = false;
        state.doctorsError = action.payload || "Failed to fetch doctors";
      });
  },
});

export const { addUser, deleteUser, updateUser, clearErrors } = userSlice.actions;

export default userSlice.reducer;
