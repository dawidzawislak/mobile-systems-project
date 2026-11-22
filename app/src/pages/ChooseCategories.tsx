import { useEffect, useState } from "react";
import CustomMultiSelect from "../components/common/CustomMultiSelect";
import { useRouteCtx } from "../hooks/useRouteCtx";
import Content from "../components/common/Content";
import { useNavigate } from "react-router-dom";
import { API } from "../utils/api";
import { Modal, Button, Textarea, AlertMessage, Spinner } from "../components/common";
import { buildRecommendRequest } from "../utils/requestBuilder";
import { InterestsDict, FoodDict } from "../utils/InterestPageDict";

export default function ChooseCategories() {
  const {
    placeCategories,
    setPlaceCategories,
    cuisineTypes,
    setCuisineTypes,
    homeLocation,
    planDays,
    setSchedule,
  } = useRouteCtx();

  const [availablePlaceCategories, setAvailablePlaceCategories] = useState<
    string[]
  >([]);
  const [availableCuisineTypes, setAvailableCuisineTypes] = useState<string[]>(
    []
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInput, setUserInput] = useState<string>("");
  const [isPredicting, setIsPredicting] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoadingCategories(true);
    setCategoriesError(null);

    const placesRequest = API.categories.getAll()
      .then((data) => {
        // Filter out unwanted categories
        const filteredCategories = data.categories.filter((cat: string) => {
          return !cat.startsWith("wheelchair") && 
                 !cat.startsWith("no_fee") && 
                 !cat.startsWith("no_access") && 
                 !cat.startsWith("fee") && 
                 !cat.startsWith("access") && 
                 !cat.startsWith("access_limited");
        });
        setAvailablePlaceCategories(filteredCategories);
      });

    const foodRequest = API.foodCategories.getAll().then((data) => {
      setAvailableCuisineTypes(data.food_categories);
    });

    Promise.all([placesRequest, foodRequest])
      .catch((err) => {
        console.error("Error fetching categories:", err);
        setCategoriesError(
          "Couldn't load categories. Check your connection and try again."
        );
      })
      .finally(() => setIsLoadingCategories(false));
  }, [reloadKey]);

  // Helper function to format category labels
  const formatCategoryLabel = (category: string): string => {
    const parts = category.split(".");
    
    // If there's only one part, format it directly
    if (parts.length === 1) {
      return parts[0]
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
    
    // If there are multiple parts, show the last two (or all if less than 2)
    // to distinguish between categories like "entertainment" and "building.entertainment"
    const relevantParts = parts.slice(-2);
    return relevantParts
      .map((part) =>
        part
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      )
      .join(" - ");
  };

  const handleGenerateSchedule = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      // Build the request using utility function
      const request = buildRecommendRequest(
        homeLocation,
        planDays,
        placeCategories,
        cuisineTypes
      );

      // Call the API
      const response = await API.recommend.create(request);

      // Update the schedule in context
      setSchedule(response.schedule);

      // Navigate to schedule page
      navigate("/schedule");
    } catch (err) {
      console.error("Error generating schedule:", err);
      setError("Failed to generate schedule. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestPreferences = async () => {
    if (!userInput.trim()) {
      setError("Please describe your perfect tour first.");
      return;
    }

    try {
      setIsPredicting(true);
      setError(null);

      const data = await API.preferences.predict({
        user_input: userInput,
      });

      // Update the selected categories with AI predictions
      setPlaceCategories(data.categories || []);
      setCuisineTypes(data.food_categories || []);
    } catch (err) {
      console.error("Error getting AI predictions:", err);
      setError("Failed to get AI suggestions. Please try again.");
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <>
      <Content
        header="Choose Categories"
        buttonNext="Plan Tour"
        buttonNextAction={handleGenerateSchedule}
        buttonNextDisabled={isGenerating || isLoadingCategories}
        buttonBack="Back"
        buttonBackAction={() => navigate("/plan")}
      >
        {/* AI Input Section */}
        <div className="mb-6 relative z-10">
          <Textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Describe your perfect tour"
            rows={4}
            disabled={isPredicting}
            className="mb-3"
          />
          <Button
            onClick={handleSuggestPreferences}
            disabled={isPredicting || !userInput.trim()}
            fullWidth
          >
            {isPredicting ? "Analyzing..." : "Suggest Preferences"}
          </Button>
        </div>

        <div className="border-t border-gray-300 pt-6 mt-6">
          <p className="text-sm text-gray-600 mb-4">
            Or manually select your preferences:
          </p>
        </div>

        {isLoadingCategories && (
          <Spinner label="Loading categories..." className="py-6" />
        )}

        {categoriesError && (
          <div className="mb-4">
            <AlertMessage type="error" message={categoriesError} />
            <Button
              onClick={() => setReloadKey((k) => k + 1)}
              variant="secondary"
              fullWidth
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        )}

        {!isLoadingCategories && !categoriesError && (
        <>
        Preferred place categories:
        <CustomMultiSelect
          options={availablePlaceCategories.map((category) => {
            const formattedLabel = formatCategoryLabel(category);
            return {
              label: (InterestsDict[formattedLabel] ?? "") + " " + formattedLabel,
              value: category,
            };
          })}
          value={placeCategories}
          onChange={(newCategories) => setPlaceCategories(newCategories)}
        />
        <br />
        Preferred cuisine types:
        <CustomMultiSelect
          options={availableCuisineTypes.map((category) => {
            const formattedLabel = formatCategoryLabel(category);
            return {
              label: (FoodDict[formattedLabel] ?? "") + " " + formattedLabel,
              value: category,
            };
          })}
          value={cuisineTypes}
          onChange={(newCategories) => setCuisineTypes(newCategories)}
        />
        </>
        )}
        {error && (
          <AlertMessage
            type="error"
            message={error}
            onClose={() => setError(null)}
            className="my-4"
          />
        )}
      </Content>

      {/* Loading Modal */}
      <Modal isOpen={isGenerating} onClose={() => {}}>
        <div className="flex flex-col items-center justify-center p-8">
          <Spinner size="lg" className="mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            Creating Your Perfect Trip
          </h2>
          <p className="text-gray-600 text-center">
            Our AI is analyzing thousands of attractions and restaurants to
            create the perfect itinerary for you...
          </p>
        </div>
      </Modal>
    </>
  );
}
