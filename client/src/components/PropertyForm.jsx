import React from 'react';
import { useForm } from 'react-hook-form';

const PropertyForm = ({ onSubmit, isLoading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Property Details</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              {...register("location", { required: "Location is required" })}
              type="text"
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="e.g. Warsaw, Downtown"
            />
            {errors.location && <p className="text-red-600 text-xs mt-1">{errors.location.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
            <select
              {...register("propertyType", { required: "Property type is required" })}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">Select type</option>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="commercial">Commercial</option>
            </select>
            {errors.propertyType && <p className="text-red-600 text-xs mt-1">{errors.propertyType.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Area (m²)</label>
            <input
              {...register("area", { 
                required: "Area is required",
                min: { value: 1, message: "Area must be positive" }
              })}
              type="number"
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="e.g. 75"
            />
            {errors.area && <p className="text-red-600 text-xs mt-1">{errors.area.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year Built</label>
            <input
              {...register("yearBuilt", { 
                required: "Year built is required",
                min: { value: 1800, message: "Year must be after 1800" },
                max: { value: new Date().getFullYear(), message: "Year cannot be in the future" }
              })}
              type="number"
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="e.g. 2010"
            />
            {errors.yearBuilt && <p className="text-red-600 text-xs mt-1">{errors.yearBuilt.message}</p>}
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-150 ease-in-out"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Property'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PropertyForm;