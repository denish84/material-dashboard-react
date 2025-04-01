import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useTransition,
} from "react";
import PropTypes from "prop-types";
import {
  Box,
  Card,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Chip,
  Collapse,
  IconButton,
  Rating,
  CircularProgress,
  Skeleton,
  Alert,
} from "@mui/material";
import MDInput from "components/MDInput";
import {
  LocalMovies,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Search,
  Clear,
  TrendingUp,
  History,
} from "@mui/icons-material";
import debounce from "lodash/debounce";

// Extracted constants to prevent rerenders
const INITIAL_STATE = {
  query: "",
  results: [],
  franchises: {},
  expandedFranchise: null,
  loading: false,
  showSuggestions: false,
  error: null,
  recentSearches: [],
};

// Memoized scoring function
const calculateRelevanceScore = (movie, searchQuery, currentYear) => {
  const recencyScore =
    1 - (currentYear - new Date(movie.release_date).getFullYear()) / 100;
  const popularityScore = movie.popularity / 100;
  const titleMatchScore = movie.title
    .toLowerCase()
    .includes(searchQuery.toLowerCase())
    ? 1
    : 0;
  return popularityScore * 0.4 + recencyScore * 0.3 + titleMatchScore * 0.3;
};

// Extracted processing function to prevent recreation
const processSearchResults = (movies, searchQuery) => {
  const currentYear = new Date().getFullYear();
  const grouped = new Map();
  const standalone = [];

  for (const movie of movies) {
    movie.relevanceScore = calculateRelevanceScore(
      movie,
      searchQuery,
      currentYear
    );
    const franchiseMatch = movie.title.match(/^(.*?)(?:[\s:]-?|\d+)/);

    if (
      franchiseMatch &&
      movies.filter((m) => m.title.startsWith(franchiseMatch[1])).length > 1
    ) {
      const franchiseName = franchiseMatch[1].trim();
      if (!grouped.has(franchiseName)) {
        grouped.set(franchiseName, []);
      }
      grouped.get(franchiseName).push(movie);
    } else {
      standalone.push(movie);
    }
  }

  const sortedFranchises = {};
  for (const [franchise, movies] of grouped) {
    sortedFranchises[franchise] = movies.sort(
      (a, b) => b.relevanceScore - a.relevanceScore
    );
  }

  return {
    franchises: sortedFranchises,
    standalone: standalone.sort((a, b) => b.relevanceScore - a.relevanceScore),
  };
};

// Memoized skeletons component
const LoadingSkeletons = React.memo(() =>
  [...Array(3)].map((_, i) => (
    <ListItem key={i}>
      <Skeleton variant="rectangular" width={45} height={68} sx={{ mr: 2 }} />
      <Box flex={1}>
        <Skeleton width="80%" />
        <Skeleton width="40%" />
      </Box>
    </ListItem>
  ))
);

const MovieSearchBar = ({ onMovieSelect }) => {
  const [state, setState] = useState(() => ({
    ...INITIAL_STATE,
    recentSearches: JSON.parse(
      localStorage.getItem("recentMovieSearches") || "[]"
    ),
  }));
  const [isPending, startTransition] = useTransition();
  const abortControllerRef = useRef(null);
  const inputRef = useRef(null);

  // Memoized search function with debounce
  const performSearch = useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setState((prev) => ({
          ...prev,
          results: [],
          franchises: {},
          showSuggestions: true,
          error: null,
        }));
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${
            process.env.REACT_APP_TMDB_API_KEY
          }&query=${encodeURIComponent(searchQuery)}&include_adult=false`,
          { signal: abortControllerRef.current.signal }
        );

        if (!response.ok) throw new Error(`Search failed: ${response.status}`);
        const data = await response.json();

        startTransition(() => {
          const processed = processSearchResults(
            data.results || [],
            searchQuery
          );
          setState((prev) => ({
            ...prev,
            franchises: processed.franchises,
            results: processed.standalone,
            showSuggestions: true,
            loading: false,
          }));
        });
      } catch (error) {
        if (error.name === "AbortError") return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to search movies. Please try again.",
          showSuggestions: true,
        }));
      }
    }, 300),
    []
  );

  // Memoized handlers
  const handleSearchChange = useCallback(
    (event) => {
      const value = event.target.value;
      setState((prev) => ({ ...prev, query: value }));
      performSearch(value);
    },
    [performSearch]
  );

  const handleMovieSelect = useCallback(
    (movie) => {
      const newRecentSearches = [
        { id: movie.id, title: movie.title, poster_path: movie.poster_path },
        ...state.recentSearches.filter((m) => m.id !== movie.id),
      ].slice(0, 5);

      localStorage.setItem(
        "recentMovieSearches",
        JSON.stringify(newRecentSearches)
      );

      setState((prev) => ({
        ...prev,
        showSuggestions: false,
        query: movie.title,
        recentSearches: newRecentSearches,
      }));

      onMovieSelect(movie);
    },
    [onMovieSelect, state.recentSearches]
  );

  const clearSearch = useCallback(() => {
    setState((prev) => ({
      ...prev,
      query: "",
      results: [],
      franchises: {},
      showSuggestions: false,
    }));
    inputRef.current?.focus();
  }, []);

  // Memoized render functions
  const renderMovieItem = useCallback(
    (movie) => (
      <ListItem
        button
        onClick={() => handleMovieSelect(movie)}
        key={movie.id}
        sx={{
          py: 1,
          transition: "background-color 0.2s",
          "&:hover": {
            bgcolor: "action.hover",
          },
        }}
      >
        <ListItemAvatar>
          <Avatar
            variant="rounded"
            src={
              movie.poster_path
                ? `https://image.tmdb.org/t/p/w154${movie.poster_path}`
                : null
            }
            sx={{
              width: 100, // Significantly increased from 45
              height: 150, // Significantly increased from 68
              mr: 2,
              transition: "transform 0.2s",
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          >
            <LocalMovies sx={{ fontSize: 40 }} />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Typography variant="body1" noWrap fontWeight="medium">
              {movie.title}
            </Typography>
          }
          secondary={
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="caption" color="text.secondary">
                {new Date(movie.release_date).getFullYear()}
              </Typography>
              <Rating
                value={movie.vote_average / 2}
                readOnly
                size="small"
                sx={{
                  "& .MuiRating-icon": {
                    transition: "transform 0.2s",
                  },
                  "&:hover .MuiRating-icon": {
                    transform: "scale(1.2)",
                  },
                }}
              />
            </Box>
          }
        />
        {movie.popularity > 50 && (
          <Chip
            size="small"
            label="Popular"
            color="primary"
            icon={<TrendingUp sx={{ fontSize: 16 }} />}
            sx={{
              ml: 1,
              transition: "all 0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: 1,
              },
            }}
          />
        )}
      </ListItem>
    ),
    [handleMovieSelect]
  );

  // Memoized recent searches component
  const recentSearchesComponent = useMemo(() => {
    if (state.recentSearches.length === 0) return null;

    return (
      <Box p={2}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          <History sx={{ fontSize: 16, mr: 1, verticalAlign: "text-bottom" }} />
          Recent Searches
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          {state.recentSearches.map((movie) => (
            <Chip
              key={movie.id}
              label={movie.title}
              size="small"
              onClick={() => handleMovieSelect(movie)}
              onDelete={() => {
                const newRecentSearches = state.recentSearches.filter(
                  (m) => m.id !== movie.id
                );
                localStorage.setItem(
                  "recentMovieSearches",
                  JSON.stringify(newRecentSearches)
                );
                setState((prev) => ({
                  ...prev,
                  recentSearches: newRecentSearches,
                }));
              }}
              sx={{
                transition: "all 0.2s",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 1,
                },
              }}
            />
          ))}
        </Box>
      </Box>
    );
  }, [state.recentSearches, handleMovieSelect]);

  // Memoized results
  const memoizedResults = useMemo(
    () => state.results.slice(0, 5).map(renderMovieItem),
    [state.results, renderMovieItem]
  );

  // Memoized franchises
  const memoizedFranchises = useMemo(
    () =>
      Object.entries(state.franchises).map(([franchise, movies]) => (
        <Box key={franchise}>
          <ListItem
            button
            onClick={() =>
              setState((prev) => ({
                ...prev,
                expandedFranchise:
                  prev.expandedFranchise === franchise ? null : franchise,
              }))
            }
            sx={{
              bgcolor: "action.selected",
              transition: "all 0.2s",
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
          >
            <ListItemText
              primary={
                <Typography variant="subtitle1" fontWeight="bold" noWrap>
                  {franchise} Series ({movies.length} movies)
                </Typography>
              }
            />
            <IconButton edge="end" size="small">
              {state.expandedFranchise === franchise ? (
                <KeyboardArrowUp />
              ) : (
                <KeyboardArrowDown />
              )}
            </IconButton>
          </ListItem>

          <Collapse in={state.expandedFranchise === franchise}>
            {movies.slice(0, 3).map(renderMovieItem)}
            {movies.length > 3 && (
              <Typography
                variant="caption"
                sx={{ pl: 2, py: 1, display: "block", color: "text.secondary" }}
              >
                + {movies.length - 3} more movies in this franchise
              </Typography>
            )}
          </Collapse>
        </Box>
      )),
    [state.franchises, state.expandedFranchise, renderMovieItem]
  );

  return (
    <Box position="relative" width="100%">
      <MDInput
        fullWidth
        inputRef={inputRef}
        value={state.query}
        onChange={handleSearchChange}
        placeholder="Search movies..."
        InputProps={{
          startAdornment: <Search sx={{ color: "action.active", mr: 1 }} />,
          endAdornment: (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {state.loading && <CircularProgress size={20} sx={{ mr: 1 }} />}
              {state.query && (
                <IconButton
                  size="small"
                  onClick={clearSearch}
                  sx={{
                    transition: "all 0.2s",
                    "&:hover": {
                      transform: "scale(1.1)",
                    },
                  }}
                >
                  <Clear />
                </IconButton>
              )}
            </Box>
          ),
        }}
        sx={{
          "& .MuiInputBase-root": {
            transition: "all 0.2s",
            "&:hover": {
              transform: "translateY(-1px)",
              boxShadow: 1,
            },
            "&.Mui-focused": {
              transform: "translateY(-1px)",
              boxShadow: 2,
            },
          },
        }}
      />

      {state.showSuggestions && (
        <Card
          sx={{
            position: "absolute",
            top: "100%",
            left: 0,
            width: "550px", // Increased from 400px to accommodate larger images
            maxWidth: "100%",
            mt: 1,
            maxHeight: "600px", // Increased from 500px
            overflowY: "auto",
            zIndex: 1000,
            boxShadow: 3,
            transition: "all 0.2s",
            "&:hover": {
              boxShadow: 6,
            },
          }}
        >
          {state.error && (
            <Alert severity="error" sx={{ m: 2 }}>
              {state.error}
            </Alert>
          )}

          {!state.query && recentSearchesComponent}

          <List>
            {state.loading ? (
              <LoadingSkeletons />
            ) : (
              <>
                {memoizedFranchises}
                {memoizedResults}

                {!state.loading &&
                  state.query &&
                  state.results.length === 0 &&
                  Object.keys(state.franchises).length === 0 && (
                    <ListItem>
                      <ListItemText
                        primary={`No results found for &quot;${state.query}&quot;`}
                        sx={{ textAlign: "center", color: "text.secondary" }}
                      />
                    </ListItem>
                  )}

                {state.results.length + Object.keys(state.franchises).length >
                  7 && (
                  <ListItem
                    button
                    sx={{
                      justifyContent: "center",
                      color: "primary.main",
                      "&:hover": {
                        bgcolor: "primary.light",
                        color: "primary.contrastText",
                      },
                    }}
                  >
                    <Typography variant="button">Show all results</Typography>
                  </ListItem>
                )}
              </>
            )}
          </List>
        </Card>
      )}
    </Box>
  );
};

MovieSearchBar.propTypes = {
  onMovieSelect: PropTypes.func.isRequired,
};

export default MovieSearchBar;
