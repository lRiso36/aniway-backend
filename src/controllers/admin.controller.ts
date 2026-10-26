import { Request, Response } from 'express'
import { AdminAnimeQuerySchema } from '../validators/anime.validators';
import AnimeModel from '../models/anime.model';
import errorHandler from '../utils/error-handler.util';

class AdminController {
    //   registry: typeof appRegistry;

    //   constructor() {
    //     this.registry = appRegistry;
    //   }

    async adminAnimeFilter(req: Request, res: Response) {
        const ADMIN_FIELDS = {
            anilistId: 1,
            displayTitle: 1,
            coverLarge: 1,
            format: 1,
            status: 1,
            episodeCount: 1,
            averageScore: 1,
            seasonYear: 1,
            trending: 1,
            popularity: 1,
            isFeatured: 1,
            isAdult: 1,
            genres: 1,
        };

        try {
            const q = AdminAnimeQuerySchema.parse(req.query);
            const filter: Record<string, unknown> = {};

            if (q.title) {
                const escaped = q.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                filter.displayTitle = { $regex: escaped, $options: 'i' };
            }
            if (q.format?.length) filter.format = { $in: q.format };
            if (q.status?.length) filter.status = { $in: q.status };
            if (q.genres?.length) filter.genres = { $in: q.genres };
            if (q.seasonYear) filter.seasonYear = q.seasonYear;
            if (q.isFeatured !== undefined) filter.isFeatured = q.isFeatured;
            if (q.isAdult !== undefined) filter.isAdult = q.isAdult;

            const dir = q.sortOrder === 'asc' ? 1 : -1;
            const sortObj = { [q.sortBy]: dir, _id: 1 } as Record<string, 1 | -1>;

            const [rows, totalCount] = await Promise.all([
                AnimeModel.find(filter, ADMIN_FIELDS)
                    .sort(sortObj)
                    .skip((q.page - 1) * q.pageSize)
                    .limit(q.pageSize)
                    .lean(),
                AnimeModel.countDocuments(filter),
            ]);

            const results = rows.map(({ _id, ...rest }) => ({
                id: String(_id),
                ...rest,
            }));

            return res.status(200).json({
                results,
                totalCount,
                pageCount: Math.ceil(totalCount / q.pageSize),
            });
        } catch (error) {
            errorHandler(error as Error, req, res);
        }
    }
}

const adminController = new AdminController();
