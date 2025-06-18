import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany
} from "typeorm";
import { Diary } from "./Diary";
import { Session } from "./Session";


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

  @Column({ nullable: true, unique: true })
  google_id?: string;

  @Column({ nullable: true })
  avatar_url?: string;

  @Column({ default: 'google' })
  provider!: string;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  @OneToMany(() => Session, session => session.user)
  sessions!: Session[];

  @OneToMany(() => Diary, diary => diary.user, {
    eager: true,
    cascade: ["remove"], // Automatically save diaries when user is saved
  })
  diaries!: Diary[];

  @BeforeInsert()
  @BeforeUpdate()
  validateEmail() {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
  }

  toJSON() {
    const { password_hash, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}