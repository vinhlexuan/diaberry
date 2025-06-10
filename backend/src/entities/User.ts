import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
	OneToMany,
} from "typeorm";
import { Diary } from "./Diary";


@Entity("user", { schema: "diaberry" })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  password_hash?: string;

  @Column({ nullable: true })
  first_name?: string;

  @Column({ nullable: true })
  last_name?: string;

  @Column({ nullable: true })
  google_id?: string;

  @Column({ nullable: true })
  avatar_url?: string;

  @Column({ default: 'google' })
  provider!: string;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

	@OneToMany(() => Diary, (diary) => diary.user, {
		eager: true, // Automatically loads diaries when fetching a user
		cascade: ["remove"], // Cascade delete diaries when a user is deleted
	})
	diaries!: Diary[];

  @BeforeInsert()
  @BeforeUpdate()
  validateEmail() {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
  }

  // Helper method to sanitize user object (remove sensitive data)
  toJSON() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}