import React from "react";
import { Route, Routes } from "react-router-dom";
import MovieSearch from "../../components/MovieSearch";
import { Box } from "@mui/material";

const Dashboard = () => {
  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        py: 3, // Padding for vertical spacing
        px: 3, // Padding for horizontal spacing
      }}
    >
      <Routes>
        <Route path="/" element={<h1>Welcome to the Dashboard!</h1>} />
        <Route path="/movie-search" element={<MovieSearch />} />
      </Routes>
    </Box>
  );
};

export default Dashboard;
