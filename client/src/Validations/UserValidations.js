import * as yup from "yup"; //import all exports from the yup

export const userSchemaValidation = yup.object().shape({
  name: yup.string().trim().required("Name is required"),
  email: yup
    .string()
    .trim()
    .email("Not valid email format")
    .required("Email is required"),
  password: yup.string().min(4, "Password must be at least 4 characters").max(20).required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password"), null], "Passwords Don't Match")
    .required("Confirm password is required"),
  // Optional fields for doctor registration
  specialization: yup.string(),
  experience: yup.string()

  /*
  age1: yup
    .number()
    .typeError("Value must be a number...")
    .integer("Value must an integer...")
    .required("Age is required...")
    .min(10)
    .max(18),

  age2: yup
    .string()
    .matches(/^\d+$/, "Value must be a whole number...") // Ensures only whole numbers
    .required("Age is required...")
    .test("is-integer", "Value must be an integer...", (value) => {
      if (!value) return false; // Ensure it's not empty
      return Number.isInteger(Number(value)); // Ensures it's a valid integer
    })
    .test("within-range", "Age must be between 10 and 18...", (value) => {
      const numValue = Number(value);
      return numValue >= 10 && numValue <= 18;
    }),

  salary: yup
    .string()
    .matches(/^\d+\.\d+$/, "Value must have a decimal value")
    .required("Salary is required...")
    .test("is-decimal", "Value must have a decimal value", (value) => {
      if (!value) return false;
      return /^\d+\.\d+$/.test(value); // Ensures it contains a decimal part
    }),
    */
});
