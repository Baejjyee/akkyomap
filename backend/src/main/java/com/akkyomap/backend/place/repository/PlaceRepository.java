package com.akkyomap.backend.place.repository;

import com.akkyomap.backend.place.entity.Place;
import com.akkyomap.backend.place.type.PlaceStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlaceRepository extends JpaRepository<Place, Long> {

    List<Place> findAllByStatus(PlaceStatus status);

    List<Place> findAllByCreatedByIdAndStatusNotOrderByCreatedAtDesc(Long createdById, PlaceStatus status);

    List<Place> findAllByStatusAndLatitudeBetweenAndLongitudeBetween(
        PlaceStatus status,
        Double swLat,
        Double neLat,
        Double swLng,
        Double neLng
    );
}
