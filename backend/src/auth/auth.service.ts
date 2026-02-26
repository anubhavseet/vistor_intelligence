import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../common/schemas/user.schema';
import { PlanService } from '../subscription/plan.service';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private planService: PlanService,
    private subscriptionService: SubscriptionService,
  ) { }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ email, isActive: true });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    const { passwordHash, ...result } = user.toObject();
    return result;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user._id, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async register(email: string, password: string, name: string) {
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({
      email,
      passwordHash,
      name,
      role: 'user',
    });

    // Auto-enroll new users on the Free plan so all feature guards work from day one.
    // Wrapped in try/catch — a subscription failure must never block registration.
    try {
      const plans = await this.planService.findPublicPlans();
      const freePlan = plans.find(p => p.amount === 0);
      if (freePlan) {
        await this.subscriptionService.createSubscription(
          user._id.toString(),
          freePlan._id.toString(),
        );
        this.logger.log(`Free subscription created for new user: ${user.email}`);
      } else {
        this.logger.warn(`No free plan found — user ${user.email} registered without a subscription`);
      }
    } catch (err: any) {
      this.logger.error(`Failed to create free subscription for ${user.email}: ${err.message}`);
    }

    const { passwordHash: _, ...result } = user.toObject();
    return result;
  }
}

