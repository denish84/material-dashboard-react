/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useEffect } from "react";

// react-router-dom components
import { useLocation } from "react-router-dom";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";

// Material Dashboard 2 React context
import { useMaterialUIController, setLayout } from "context";

// ****** IMPORTANT: MEASURE YOUR ACTUAL NAVBAR HEIGHT ******
// Use browser DevTools to inspect the element and find its height.
const NAVBAR_HEIGHT = "64px"; // <-- REPLACE '64px' WITH YOUR ACTUAL NAVBAR HEIGHT

function DashboardLayout({ children }) {
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav } = controller;
  const { pathname } = useLocation();

  useEffect(() => {
    setLayout(dispatch, "dashboard");
  }, [pathname]);

  return (
    <MDBox
      sx={({ breakpoints, transitions, functions: { pxToRem } }) => ({
        // p: 3, // Original padding on all sides
        px: 3, // Changed to padding left/right only (theme.spacing(3))
        py: 3, // Keep original vertical padding if needed, or remove if paddingTop is sufficient
        position: "relative",

        // --- ADDED PADDING TOP TO ACCOUNT FOR NAVBAR ---
        // This pushes the content ({children}) down below the navbar
        paddingTop: NAVBAR_HEIGHT,
        // Adjust the 'py: 3' above if this adds too much space. You might
        // only need paddingTop: NAVBAR_HEIGHT and px: 3.

        // --- Existing responsive styles ---
        [breakpoints.up("xl")]: {
          marginLeft: miniSidenav ? pxToRem(120) : pxToRem(274),
          transition: transitions.create(["margin-left", "margin-right"], {
            easing: transitions.easing.easeInOut,
            duration: transitions.duration.standard,
          }),
        },
      })}
    >
      {/* The DashboardNavbar is likely rendered *inside* the {children}
          in this specific setup, or positioned absolutely/fixed elsewhere.
          This padding ensures the children start below where the Navbar sits. */}
      {children}
    </MDBox>
  );
}

// Typechecking props for the DashboardLayout
DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default DashboardLayout;
