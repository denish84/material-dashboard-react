import React, { useState, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Grid,
  Card,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import MDAlert from "components/MDAlert";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { supabase } from "supabaseClient";
import MovieTags from "components/MovieTags";
import MovieSearchBar from "components/MovieSearchBar";

// Constants
const CATEGORIES = {
  NEW_RELEASES: "new releases",
  TRENDING: "trending",
  POPULAR: "popular",
};

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

const INITIAL_STATE = {
  movieDetails: null,
  m3u8Link: "",
  assetId: "", // Asset ID field - no longer mandatory
  loading: false,
  error: null,
  success: false,
  movies: [],
  selectedTags: [],
  selectedCategory: "",
  page: 0,
  rowsPerPage: 10,
  totalCount: 0,
  editingMovie: null,
};

const MoviePoster = React.memo(({ path, title, width = 100 }) => (
  <img
    src={`https://image.tmdb.org/t/p/w154${path}`}
    alt={title}
    style={{
      width,
      height: width * 1.5,
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      transition: "transform 0.2s",
    }}
    loading="lazy"
  />
));

MoviePoster.propTypes = {
  path: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  width: PropTypes.number,
};

// MovieTableRow Component
const MovieTableRow = React.memo(({ movie, onEdit, onDelete }) => (
  <TableRow>
    <TableCell style={{ width: "120px" }}>
      <MoviePoster path={movie.poster_path} title={movie.title} />
    </TableCell>
    <TableCell>{movie.title}</TableCell>
    <TableCell>{movie.release_date}</TableCell>
    <TableCell>{movie.asset_id}</TableCell> {/* Asset ID column */}
    <TableCell>{movie.category}</TableCell>
    <TableCell>
      {movie.custom_tags?.map((tag) => (
        <Chip key={tag} label={tag} size="small" sx={{ m: 0.5 }} />
      ))}
    </TableCell>
    <TableCell>
      <MDButton variant="text" color="info" onClick={() => onEdit(movie)}>
        Edit
      </MDButton>
      <MDButton variant="text" color="error" onClick={() => onDelete(movie.id)}>
        Delete
      </MDButton>
    </TableCell>
  </TableRow>
));

MovieTableRow.propTypes = {
  movie: PropTypes.shape({
    id: PropTypes.number.isRequired,
    poster_path: PropTypes.string,
    title: PropTypes.string.isRequired,
    release_date: PropTypes.string,
    asset_id: PropTypes.string, // Asset ID prop type
    category: PropTypes.string,
    custom_tags: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

// MovieTable Component
const MovieTable = React.memo(
  ({
    movies,
    loading,
    page,
    rowsPerPage,
    totalCount,
    onPageChange,
    onRowsPerPageChange,
    onEdit,
    onDelete,
  }) => (
    <>
      <TableContainer
        component={Paper}
        sx={{
          mt: 3,
          "& .MuiTable-root": {
            minWidth: 800,
            "& td": {
              padding: "16px",
            },
          },
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Poster</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Release Date</TableCell>
              <TableCell>Asset ID</TableCell> {/* Asset ID header */}
              <TableCell>Category</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  {" "}
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : (
              movies.map((movie) => (
                <MovieTableRow
                  key={movie.id}
                  movie={movie}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
      />
    </>
  )
);

MovieTable.propTypes = {
  movies: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onRowsPerPageChange: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

// MovieForm Component
const MovieForm = React.memo(
  ({
    movieDetails,
    loading,
    editingMovie,
    m3u8Link,
    assetId, // Asset ID prop
    selectedCategory,
    selectedTags,
    onM3u8LinkChange,
    onAssetIdChange, // Asset ID change handler
    onCategoryChange,
    onTagsChange,
    onSave,
    onCancel,
  }) => (
    <MDBox mt={3}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <MDBox
            component="img"
            src={`https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`}
            alt={movieDetails.title}
            width="100%"
            borderRadius="lg"
            shadow="md"
            loading="lazy"
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <MDTypography variant="h5" mb={2}>
            {editingMovie ? "Edit Movie" : "Add New Movie"}
          </MDTypography>
          <MDTypography variant="body2" color="text" mb={2}>
            {movieDetails.overview}
          </MDTypography>

          <Grid container spacing={2}>
            {/* Asset ID field - Now optional */}
            <Grid item xs={12}>
              <MDInput
                fullWidth
                value={assetId}
                onChange={onAssetIdChange}
                placeholder="Enter Asset ID"
                label="Asset ID"
              />
            </Grid>

            <Grid item xs={12}>
              <Select
                fullWidth
                value={selectedCategory}
                onChange={onCategoryChange}
                displayEmpty
              >
                <MenuItem value="" disabled>
                  Select Category
                </MenuItem>
                {Object.values(CATEGORIES).map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </Grid>

            <Grid item xs={12}>
              <MovieTags
                movieDetails={movieDetails}
                onTagsChange={onTagsChange}
              />
            </Grid>

            <Grid item xs={12}>
              <MDInput
                fullWidth
                value={m3u8Link}
                onChange={onM3u8LinkChange}
                placeholder="Enter M3U8 Link"
                label="M3U8 Link"
              />
            </Grid>

            <Grid item xs={12}>
              <MDButton
                variant="gradient"
                color="success"
                onClick={onSave}
                disabled={loading} // Removed assetId requirement
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : editingMovie ? (
                  "Update Movie"
                ) : (
                  "Save Movie"
                )}
              </MDButton>
              {editingMovie && (
                <MDButton
                  variant="outlined"
                  color="secondary"
                  onClick={onCancel}
                  sx={{ ml: 2 }}
                >
                  Cancel Edit
                </MDButton>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </MDBox>
  )
);

MovieForm.propTypes = {
  movieDetails: PropTypes.object.isRequired,
  loading: PropTypes.bool.isRequired,
  editingMovie: PropTypes.object,
  m3u8Link: PropTypes.string.isRequired,
  assetId: PropTypes.string.isRequired, // Asset ID prop type
  selectedCategory: PropTypes.string.isRequired,
  selectedTags: PropTypes.arrayOf(PropTypes.string).isRequired,
  onM3u8LinkChange: PropTypes.func.isRequired,
  onAssetIdChange: PropTypes.func.isRequired, // Asset ID change handler prop type
  onCategoryChange: PropTypes.func.isRequired,
  onTagsChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
// Custom Hooks
const useMovies = (page, rowsPerPage) => {
  const [state, setState] = useState({
    movies: [],
    totalCount: 0,
    loading: false,
    error: null,
  });

  const fetchMovies = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { data, error, count } = await supabase
        .from("movies")
        .select("*", { count: "exact" })
        .range(page * rowsPerPage, (page + 1) * rowsPerPage - 1)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setState((prev) => ({
        ...prev,
        movies: data,
        totalCount: count,
        loading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err.message,
        loading: false,
      }));
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const deleteMovie = useCallback(
    async (id) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const { error } = await supabase.from("movies").delete().match({ id });
        if (error) throw error;
        await fetchMovies();
        return true;
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err.message,
          loading: false,
        }));
        return false;
      }
    },
    [fetchMovies]
  );

  return {
    ...state,
    fetchMovies,
    deleteMovie,
  };
};

const useMovieForm = (onSuccess) => {
  const [formState, setFormState] = useState({
    loading: false,
    error: null,
    success: false,
  });

  const saveMovie = useCallback(
    async (
      movieDetails,
      m3u8Link,
      assetId, // Asset ID parameter
      selectedCategory,
      selectedTags,
      editingMovie = null
    ) => {
      // Validate required fields - removed assetId requirement
      if (!movieDetails || !selectedCategory) {
        setFormState((prev) => ({
          ...prev,
          error: "Please fill in all required fields including category",
        }));
        return;
      }

      setFormState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        success: false,
      }));

      try {
        const tmdbId = movieDetails.tmdb_id || movieDetails.id;
        const [fullMovieDetails, credits] = await Promise.all([
          fetch(
            `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${process.env.REACT_APP_TMDB_API_KEY}`
          ).then((res) => res.json()),
          fetch(
            `https://api.themoviedb.org/3/movie/${tmdbId}/credits?api_key=${process.env.REACT_APP_TMDB_API_KEY}`
          ).then((res) => res.json()),
        ]);

        const movieData = {
          title: movieDetails.title,
          slug: movieDetails.title.toLowerCase().replace(/[^\w-]+/g, "-"),
          overview: movieDetails.overview,
          poster_path: movieDetails.poster_path,
          release_date: movieDetails.release_date,
          m3u8_link: m3u8Link.trim(),
          asset_id: assetId.trim(), // Asset ID still included but not required
          tmdb_id: tmdbId,
          rating:
            movieDetails.vote_average || fullMovieDetails.vote_average || 0,
          duration: fullMovieDetails.runtime || 0,
          cast: credits.cast?.slice(0, 6).map((actor) => ({
            name: actor.name || "Unknown Actor",
            character: actor.character || "Unknown Role",
            profile_path: actor.profile_path || null,
          })),
          director:
            credits.crew?.find((member) => member.job === "Director")?.name ||
            "Unknown",
          category: selectedCategory,
          custom_tags: selectedTags,
        };

        const result = editingMovie
          ? await supabase
              .from("movies")
              .update(movieData)
              .eq("id", editingMovie.id)
          : await supabase.from("movies").insert(movieData);

        if (result.error) throw result.error;

        setFormState((prev) => ({
          ...prev,
          success: true,
          loading: false,
        }));

        onSuccess?.();
      } catch (err) {
        setFormState((prev) => ({
          ...prev,
          error: err.message,
          loading: false,
        }));
      }
    },
    [onSuccess]
  );

  return {
    ...formState,
    saveMovie,
  };
};

// Main MovieSearch Component
function MovieSearch() {
  const [state, setState] = useState(INITIAL_STATE);
  const {
    movieDetails,
    m3u8Link,
    assetId, // Asset ID state
    selectedTags,
    selectedCategory,
    page,
    rowsPerPage,
    editingMovie,
  } = state;

  const {
    movies,
    totalCount,
    loading: moviesLoading,
    error: moviesError,
    fetchMovies,
    deleteMovie,
  } = useMovies(page, rowsPerPage);

  const {
    loading: formLoading,
    error: formError,
    success,
    saveMovie,
  } = useMovieForm(() => {
    setState((prev) => ({
      ...prev,
      movieDetails: null,
      m3u8Link: "",
      assetId: "", // Reset Asset ID
      selectedCategory: "",
      selectedTags: [],
      editingMovie: null,
    }));
    fetchMovies();
  });

  const handleMovieSelect = useCallback((details) => {
    setState((prev) => ({
      ...prev,
      movieDetails: details,
    }));
  }, []);

  const handleM3u8LinkChange = useCallback((e) => {
    setState((prev) => ({
      ...prev,
      m3u8Link: e.target.value,
    }));
  }, []);

  // Asset ID change handler
  const handleAssetIdChange = useCallback((e) => {
    setState((prev) => ({
      ...prev,
      assetId: e.target.value,
    }));
  }, []);

  const handleCategoryChange = useCallback((e) => {
    setState((prev) => ({
      ...prev,
      selectedCategory: e.target.value,
    }));
  }, []);

  const handleTagsChange = useCallback((tags) => {
    setState((prev) => ({
      ...prev,
      selectedTags: tags,
    }));
  }, []);

  const handlePageChange = useCallback((_, newPage) => {
    setState((prev) => ({
      ...prev,
      page: newPage,
    }));
  }, []);

  const handleRowsPerPageChange = useCallback((event) => {
    setState((prev) => ({
      ...prev,
      page: 0,
      rowsPerPage: parseInt(event.target.value, 10),
    }));
  }, []);

  const handleEdit = useCallback((movie) => {
    setState((prev) => ({
      ...prev,
      editingMovie: movie,
      movieDetails: movie,
      m3u8Link: movie.m3u8_link,
      assetId: movie.asset_id || "", // Set Asset ID when editing
      selectedCategory: movie.category,
      selectedTags: movie.custom_tags || [],
    }));
  }, []);

  const handleSave = useCallback(() => {
    saveMovie(
      movieDetails,
      m3u8Link,
      assetId, // Pass Asset ID to saveMovie
      selectedCategory,
      selectedTags,
      editingMovie
    );
  }, [
    movieDetails,
    m3u8Link,
    assetId, // Include Asset ID in dependencies
    selectedCategory,
    selectedTags,
    editingMovie,
    saveMovie,
  ]);

  const handleCancel = useCallback(() => {
    setState((prev) => ({
      ...prev,
      editingMovie: null,
      movieDetails: null,
      m3u8Link: "",
      assetId: "", // Reset Asset ID
      selectedCategory: "",
      selectedTags: [],
    }));
  }, []);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
              >
                <MDTypography variant="h6" color="white">
                  Movie Search
                </MDTypography>
              </MDBox>
              <MDBox p={3}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <MovieSearchBar onMovieSelect={handleMovieSelect} />
                  </Grid>
                </Grid>

                {movieDetails && (
                  <MovieForm
                    movieDetails={movieDetails}
                    loading={formLoading}
                    editingMovie={editingMovie}
                    m3u8Link={m3u8Link}
                    assetId={assetId} // Pass Asset ID to form
                    selectedCategory={selectedCategory}
                    selectedTags={selectedTags}
                    onM3u8LinkChange={handleM3u8LinkChange}
                    onAssetIdChange={handleAssetIdChange} // Pass Asset ID change handler
                    onCategoryChange={handleCategoryChange}
                    onTagsChange={handleTagsChange}
                    onSave={handleSave}
                    onCancel={handleCancel}
                  />
                )}

                {(formError || moviesError) && (
                  <MDAlert color="error" mt={2}>
                    {formError || moviesError}
                  </MDAlert>
                )}

                {success && (
                  <MDAlert color="success" mt={2}>
                    Movie saved successfully!
                  </MDAlert>
                )}

                <MovieTable
                  movies={movies}
                  loading={moviesLoading}
                  page={page}
                  rowsPerPage={rowsPerPage}
                  totalCount={totalCount}
                  onPageChange={handlePageChange}
                  onRowsPerPageChange={handleRowsPerPageChange}
                  onEdit={handleEdit}
                  onDelete={deleteMovie}
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default React.memo(MovieSearch);
