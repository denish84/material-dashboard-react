import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Grid,
  Chip,
  Paper,
  Tooltip,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Box,
  OutlinedInput,
} from "@mui/material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import {
  LocalOffer,
  EmojiEvents,
  Stars,
  Movie,
  Shuffle,
} from "@mui/icons-material";

// Constants
const GENRE_COMBOS = {
  "Edge of Seat": ["Thriller", "Suspense"],
  "Mind Bending": ["Psychological", "Plot-Twist"],
  "Heart Racing": ["Action", "High-Octane"],
  "Soul Stirring": ["Drama", "Thought-Provoking"],
  "Spine Chilling": ["Horror", "Psychological"],
  "Feel Good Vibes": ["Comedy", "Feel-Good"],
  "Visual Spectacle": ["Epic", "High-Octane"],
  "Time Bender": ["Sci-Fi", "Plot-Twist"],
  "Emotional Rollercoaster": ["Drama", "Plot-Twist"],
  "Family Fun": ["Animation", "Family-Friendly"],
  "Dark Comedy": ["Comedy", "Drama"],
  "Romantic Comedy": ["Romance", "Comedy"],
  "Action Comedy": ["Action", "Comedy"],
  "Psychological Thriller": ["Horror", "Psychological"],
  "Sci-Fi Action": ["Sci-Fi", "Action"],
};

const GENRE_MAP = {
  28: { primary: ["Action"], secondary: ["High-Octane"] },
  12: { primary: ["Adventure"], secondary: ["Epic"] },
  16: { primary: ["Animation"], secondary: ["Family-Friendly"] },
  35: { primary: ["Comedy"], secondary: ["Feel-Good", "Adult Humor"] },
  80: { primary: ["Thriller"], secondary: ["Suspense"] },
  18: { primary: ["Drama"], secondary: ["Thought-Provoking"] },
  27: { primary: ["Horror"], secondary: ["Psychological"] },
  878: { primary: ["Sci-Fi"], secondary: ["Futuristic"] },
  10752: { primary: ["War"], secondary: ["Historical"] },
  10749: { primary: ["Romance"], secondary: ["Heartwarming"] },
  53: { primary: ["Mystery"], secondary: ["Plot-Twist"] },
  99: { primary: ["Documentary"], secondary: ["Educational"] },
  10402: { primary: ["Musical"], secondary: ["Upbeat"] },
  37: { primary: ["Western"], secondary: ["Classic"] },
};

function MovieTags({ movieDetails, onTagsChange }) {
  const [selectedTags, setSelectedTags] = useState([]);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [selectedCombos, setSelectedCombos] = useState([]); // Changed to array for multiple selections

  const createTag = (tag, source, icon, category, isSmartCombo = false) => ({
    tag,
    source,
    icon: icon ? <icon fontSize="small" /> : null,
    category,
    isSmartCombo,
  });

  const getTagStyle = (tagObj) => {
    const baseStyle = {
      m: 0.5,
      "&:hover": {
        backgroundColor: selectedTags.includes(tagObj.tag)
          ? "primary.light"
          : "action.hover",
      },
    };

    const styles = {
      "smart-combo": {
        ...baseStyle,
        fontWeight: "bold",
        background: "linear-gradient(45deg, #e3f2fd, #e8eaf6)",
        border: "2px solid",
        borderColor: "info.main",
      },
      awards: {
        ...baseStyle,
        fontWeight: "bold",
        border: "2px solid #FFD700",
        color: tagObj.category === "primary" ? "#B8860B" : "#DAA520",
      },
      "content-analysis":
        tagObj.tag === "Based on True Story"
          ? {
              ...baseStyle,
              fontWeight: "bold",
              border: "2px solid #4CAF50",
              color: "#1B5E20",
            }
          : baseStyle,
      primary: {
        ...baseStyle,
        fontWeight: "bold",
        border: "2px solid",
        borderColor: "primary.main",
      },
      secondary: {
        ...baseStyle,
        border: "1px solid",
        borderColor: "secondary.main",
      },
      default: {
        ...baseStyle,
        border: "1px dashed",
        borderColor: "text.secondary",
      },
    };

    return styles[tagObj.source] || styles[tagObj.category] || styles.default;
  };

  const analyzeTags = (movie, currentSelected = []) => {
    if (!movie) return [];

    const tags = [];
    const releaseYear = new Date(movie.release_date).getFullYear();
    const currentYear = new Date().getFullYear();

    // Process genre-based tags
    movie.genre_ids?.forEach((genreId) => {
      const genreTags = GENRE_MAP[genreId];
      if (genreTags) {
        genreTags.primary.forEach((tag) =>
          tags.push(createTag(tag, "genre", Movie, "primary"))
        );
        genreTags.secondary.forEach((tag) =>
          tags.push(createTag(tag, "genre-derived", LocalOffer, "secondary"))
        );
      }
    });

    // Add special tags based on conditions
    const addSpecialTag = (condition, tag, source, icon, category) => {
      if (condition) {
        tags.push(createTag(tag, source, icon, category));
      }
    };

    // Based on True Story
    const hasHistoricalKeywords = movie.overview
      ?.toLowerCase()
      .match(
        /\b(based on|true story|real events|real life|actual events|inspired by|true account)\b/
      );
    addSpecialTag(
      hasHistoricalKeywords &&
        (movie.genre_ids?.includes(18) || movie.genre_ids?.includes(99)) &&
        movie.vote_average >= 6.5 &&
        movie.vote_count > 1000,
      "Based on True Story",
      "content-analysis",
      LocalOffer,
      "primary"
    );

    // Awards and ratings
    const isClassicPeriod = releaseYear < 2000;
    addSpecialTag(
      (isClassicPeriod &&
        movie.vote_average >= 7.5 &&
        movie.vote_count > 1000) ||
        (!isClassicPeriod &&
          movie.vote_average >= 7.8 &&
          movie.vote_count > 2000 &&
          movie.popularity > 50),
      "OSCAR® Winner",
      "awards",
      EmojiEvents,
      "primary"
    );

    addSpecialTag(
      (isClassicPeriod &&
        movie.vote_average >= 7.2 &&
        movie.vote_count > 800) ||
        (!isClassicPeriod &&
          movie.vote_average >= 7.5 &&
          movie.vote_count > 1500),
      "OSCAR® Nominee",
      "awards",
      EmojiEvents,
      "secondary"
    );

    // Rating and popularity based tags
    addSpecialTag(
      movie.vote_average >= 8 && movie.vote_count > 1000,
      "Must Watch",
      "ratings",
      Stars,
      "primary"
    );

    addSpecialTag(
      movie.popularity > 100 && movie.vote_count > 500,
      "Trending",
      "popularity",
      Stars,
      "secondary"
    );

    // Year-based tags
    addSpecialTag(
      releaseYear === currentYear,
      "Latest Release",
      "year",
      LocalOffer,
      "secondary"
    );

    addSpecialTag(
      releaseYear === currentYear - 1,
      "Recent",
      "year",
      LocalOffer,
      "suggested"
    );

    addSpecialTag(
      releaseYear < 2000,
      "Classic",
      "year",
      LocalOffer,
      "secondary"
    );

    // Suggest combinations but don't auto-add them
    const existingTags = new Set(currentSelected);
    Object.entries(GENRE_COMBOS).forEach(([combo, requires]) => {
      if (requires.every((tag) => existingTags.has(tag))) {
        tags.push(
          createTag(combo, "suggested-combo", Shuffle, "secondary", false)
        );
      }
    });

    return tags.map((tag) => ({
      ...tag,
      selected: currentSelected.includes(tag.tag),
    }));
  };

  const handleComboChange = (event) => {
    const { value } = event.target;
    setSelectedCombos(value);

    // Get all tags from existing selections that aren't combo tags
    const nonComboTags = selectedTags.filter(
      (tag) => !Object.keys(GENRE_COMBOS).includes(tag)
    );

    // Add all selected combinations
    const newTags = [...nonComboTags, ...value];

    setSelectedTags(newTags);
    onTagsChange(newTags);
  };

  const handleTagToggle = (tagObj) => {
    const tag = tagObj.tag;
    let newTags;

    if (selectedTags.includes(tag)) {
      // Remove the clicked tag
      newTags = selectedTags.filter((t) => t !== tag);

      // If it's a combo tag, also remove it from selectedCombos
      if (Object.keys(GENRE_COMBOS).includes(tag)) {
        setSelectedCombos(selectedCombos.filter((combo) => combo !== tag));
      }
    } else {
      // Add the clicked tag
      newTags = [...selectedTags, tag];

      // If it's a combo tag, also add it to selectedCombos
      if (Object.keys(GENRE_COMBOS).includes(tag)) {
        setSelectedCombos([...selectedCombos, tag]);
      }
    }

    setSelectedTags(newTags);
    onTagsChange(newTags);
  };

  useEffect(() => {
    if (movieDetails) {
      setSuggestedTags(analyzeTags(movieDetails, selectedTags));
    }
  }, [movieDetails, selectedTags]);

  if (!movieDetails) return null;

  return (
    <MDBox mt={2}>
      <MDTypography variant="h6" gutterBottom>
        Suggested Tags
      </MDTypography>
      <Paper elevation={0} sx={{ p: 2, backgroundColor: "transparent" }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel id="combo-tag-label">
                Select Genre Combinations
              </InputLabel>
              <Select
                labelId="combo-tag-label"
                id="combo-tag-select"
                multiple
                value={selectedCombos}
                onChange={handleComboChange}
                input={<OutlinedInput label="Select Genre Combinations" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((combo) => (
                      <Chip
                        key={combo}
                        label={combo}
                        size="small"
                        icon={<Shuffle fontSize="small" />}
                      />
                    ))}
                  </Box>
                )}
              >
                {Object.keys(GENRE_COMBOS).map((combo) => (
                  <MenuItem key={combo} value={combo}>
                    <MDBox display="flex" alignItems="center" gap={1}>
                      <Shuffle fontSize="small" />
                      {combo}
                      <MDTypography
                        variant="caption"
                        color="text"
                        sx={{ ml: "auto" }}
                      >
                        ({GENRE_COMBOS[combo].join(", ")})
                      </MDTypography>
                    </MDBox>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Grid container spacing={1}>
              {suggestedTags.map((tagObj) => (
                <Grid item key={tagObj.tag}>
                  <Tooltip title={`Source: ${tagObj.source}`}>
                    <Chip
                      label={
                        <MDBox display="flex" alignItems="center" gap={1}>
                          {tagObj.icon}
                          {tagObj.tag}
                        </MDBox>
                      }
                      color={
                        selectedTags.includes(tagObj.tag)
                          ? "primary"
                          : "default"
                      }
                      onClick={() => handleTagToggle(tagObj)}
                      sx={getTagStyle(tagObj)}
                    />
                  </Tooltip>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    </MDBox>
  );
}

MovieTags.propTypes = {
  movieDetails: PropTypes.shape({
    genre_ids: PropTypes.arrayOf(PropTypes.number),
    vote_average: PropTypes.number,
    vote_count: PropTypes.number,
    release_date: PropTypes.string,
    popularity: PropTypes.number,
    overview: PropTypes.string,
  }).isRequired,
  onTagsChange: PropTypes.func.isRequired,
};

export default MovieTags;
