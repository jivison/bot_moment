import { Entity, PrimaryGeneratedColumn, BaseEntity, Column } from "typeorm";

@Entity({ name: "artist_redirects" })
export class ArtistRedirect extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  from!: string;

  @Column({ nullable: true })
  to?: string;

  static async check(artistName: string): Promise<ArtistRedirect | undefined> {
    return await this.findOne({ from: artistName });
  }

  redirectDisplay(): string {
    return this.to
      ? ` (_redirected from ${this.from}_)`
      : "";
  }
}
