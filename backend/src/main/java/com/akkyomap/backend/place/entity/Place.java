package com.akkyomap.backend.place.entity;

import com.akkyomap.backend.global.exception.BusinessException;
import com.akkyomap.backend.global.exception.ErrorCode;
import com.akkyomap.backend.place.type.PlaceCategory;
import com.akkyomap.backend.place.type.PlaceStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Place {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PlaceCategory category;

    @Column(nullable = false, length = 255)
    private String address;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(length = 500)
    private String priceInfo;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PlaceStatus status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private Place(
        String name,
        PlaceCategory category,
        String address,
        Double latitude,
        Double longitude,
        String priceInfo,
        String description
    ) {
        this.name = name;
        this.category = category;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.priceInfo = priceInfo;
        this.description = description;
        this.status = PlaceStatus.PENDING;
    }

    public static Place create(
        String name,
        PlaceCategory category,
        String address,
        Double latitude,
        Double longitude,
        String priceInfo,
        String description
    ) {
        return new Place(name, category, address, latitude, longitude, priceInfo, description);
    }

    public void approve() {
        validatePendingStatus();
        this.status = PlaceStatus.APPROVED;
    }

    public void reject() {
        validatePendingStatus();
        this.status = PlaceStatus.REJECTED;
    }

    private void validatePendingStatus() {
        if (this.status != PlaceStatus.PENDING) {
            throw new BusinessException(ErrorCode.INVALID_PLACE_STATUS);
        }
    }

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
