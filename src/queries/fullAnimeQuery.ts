export const ANIME_DETAIL_QUERY = `
    query ($ids: [Int]) {
    Page(perPage: 50) {
    media(id_in: $ids, type: ANIME) {
        id
        idMal
        title {
            english
            romaji
        }
        coverImage {
            large
            extraLarge
            color
        }
        bannerImage
        episodes
        duration
        averageScore
        popularity
        favourites
        isAdult
        genres
        tags {
            name
            rank
            isMediaSpoiler
        }
        synonyms
        description
        format
        status
        trailer {
            id
            site
            thumbnail
        }
        characters(sort: ROLE) {
            edges {
                role
                node {
                    id
                    name {
                        full
                    }
                    image {
                        large
                    }
                }
                voiceActors {
                    id
                    name {
                        full
                    }
                    language
                    image {
                        large
                    }
                }
            }
        }
        studios {
            edges {
                isMain
                node {
                    id
                    name
                    isAnimationStudio
                }
            }
        }
        source
        startDate {
            year
            month
            day
        }
        endDate {
            year
            month
            day
        }
        season
        seasonYear
        externalLinks {
            url
            site
            icon
            color
        }
    }
}
}
`;